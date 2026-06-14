<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Quote;
use App\Models\Attendance;
use App\Notifications\SystemNotification;
use Illuminate\Support\Carbon;

class QuoteFollowupNotification extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'quotes:notify-followup';

    /**
     * The console command description.
     */
    protected $description = 'Trigger random follow-up notifications for high priority quotes during staff shift';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $timeStr = $now->toTimeString();
        $todayStr = $now->toDateString();

        $this->info("Running quote follow-up notification checker at {$now}");

        // Fetch active salesman users
        $salesmen = User::where('role', 'salesman')
            ->where('is_active', true)
            ->get();

        foreach ($salesmen as $user) {
            // Check shift timings
            $onShift = true;
            if ($user->shift_start && $user->shift_end) {
                // If shift wraps overnight (e.g. 22:00 to 06:00), handle it, but assume standard day shifts
                if ($user->shift_start <= $user->shift_end) {
                    $onShift = ($timeStr >= $user->shift_start && $timeStr <= $user->shift_end);
                } else {
                    $onShift = ($timeStr >= $user->shift_start || $timeStr <= $user->shift_end);
                }
            }

            if (!$onShift) {
                $this->line("Salesman {$user->name} is not on shift hours ({$user->shift_start} - {$user->shift_end}). Skipping.");
                continue;
            }

            // Check if clocked in
            $isClockedIn = Attendance::where('user_id', $user->id)
                ->whereNull('clock_out')
                ->exists();

            if (!$isClockedIn) {
                $this->line("Salesman {$user->name} is not clocked in. Skipping.");
                continue;
            }

            // Fetch pending quotes with follow-up due date <= today
            // and last_notified_at is not today
            $quotes = Quote::where('user_id', $user->id)
                ->whereIn('status', ['draft', 'sent'])
                ->whereNotNull('due_date')
                ->where('due_date', '<=', $todayStr)
                ->where(function ($query) use ($todayStr) {
                    $query->whereNull('last_notified_at')
                          ->orWhereDate('last_notified_at', '<', $todayStr);
                })
                ->with('customer')
                ->get();

            if ($quotes->isEmpty()) {
                $this->line("Salesman {$user->name} has no pending follow-up quotes due today.");
                continue;
            }

            // Random selection / probability check
            // For the random aspect, we check a chance out of 100
            // and we prioritize quotes with higher closing ratios
            foreach ($quotes as $quote) {
                $closingRatio = $quote->closing_ratio ?? 50; // default 50% chance if not set
                $roll = rand(1, 100);

                if ($roll <= $closingRatio) {
                    // Trigger notification
                    $user->notify(new SystemNotification([
                        'title' => 'High Priority Quote Follow-up',
                        'message' => "Follow-up reminder: Quote {$quote->quote_number} for " . ($quote->customer->name ?? 'Client') . " has a closing ratio of {$closingRatio}%.",
                        'type' => 'warning',
                        'action_url' => "/staff/quotes/{$quote->id}"
                    ]));

                    // Mark as notified today
                    $quote->update([
                        'last_notified_at' => $now
                    ]);

                    $this->info("Notified {$user->name} about Quote {$quote->quote_number} (Closing Ratio: {$closingRatio}%, rolled {$roll}).");
                    
                    // Trigger only one notification per staff member per cron execution to avoid spamming
                    break; 
                }
            }
        }

        $this->info("Completed quote follow-up notification checker.");
    }
}
