<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class DummyAttendanceSeeder extends Seeder
{
    public function run()
    {
        // Ensure we have 15 staff users for a rich dataset
        $staffIds = [];
        
        for ($i = 1; $i <= 15; $i++) {
            $user = User::firstOrCreate(
                ['email' => "staff{$i}@zeronix.com"],
                [
                    'name' => "Staff Member {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'staff',
                    'shift_start' => '09:00:00',
                    'shift_end' => '18:00:00',
                ]
            );
            $staffIds[] = $user->id;
        }

        // Get all staff users
        $users = User::whereIn('id', $staffIds)->get();
        
        // Clear all attendance for these specific users to prevent massive duplicate inflation
        Attendance::whereIn('user_id', $users->pluck('id'))->delete();

        $now = now();
        
        // We will seed the past 7 days to give a thick history
        for ($daysAgo = 7; $daysAgo >= 0; $daysAgo--) {
            $targetDate = $now->copy()->subDays($daysAgo);
            
            // Skip Sundays for all staff (assumed weekly day off)
            if ($targetDate->isSunday()) {
                continue;
            }
            
            foreach ($users as $u) {
                // Determine Scenario for this specific staff member on this specific day
                // 1: On time & full shift (50%)
                // 2: Late & full shift (20%)
                // 3: Early clock in & full shift (10%)
                // 4: Clocked out early/in between shift (10%)
                // 5: Absent (No record) (10%)
                $scenario = rand(1, 100);
                
                $isToday = $daysAgo === 0;

                if ($scenario <= 50) {
                    // On time
                    $clockIn = $targetDate->copy()->setTime(9, rand(0, 15));
                } elseif ($scenario <= 70) {
                    // Late
                    $clockIn = $targetDate->copy()->setTime(9, rand(16, 59));
                } elseif ($scenario <= 80) {
                    // Early
                    $clockIn = $targetDate->copy()->setTime(8, rand(40, 59));
                } elseif ($scenario <= 90) {
                    // Short shift / early clock out
                    $clockIn = $targetDate->copy()->setTime(9, rand(0, 30));
                    
                    if (!$isToday || rand(0, 1) === 0) {
                        // Clock out around 2 PM
                        $clockOut = $targetDate->copy()->setTime(14, rand(0, 59));
                        $duration = $clockOut->diffInMinutes($clockIn);
                        
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => $clockOut,
                            'duration_minutes' => $duration,
                            'clock_out_reason' => 'Emergency Leave'
                        ]);
                    } else {
                        // active
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => null,
                            'duration_minutes' => null
                        ]);
                    }
                    continue; // Done with this record
                } else {
                    // Scenario > 90 -> Absent (Do nothing)
                    continue;
                }

                // Normal clock out generation for scenarios 1-3
                if ($isToday) {
                    // For today, decide if they are still active or finished
                    if (rand(0, 10) > 2) {
                        // Still active
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => null,
                            'duration_minutes' => null
                        ]);
                    } else {
                        // Finished early today
                        $clockOut = $targetDate->copy()->setTime(17, rand(0, 59));
                        $duration = $clockOut->diffInMinutes($clockIn);
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => $clockOut,
                            'duration_minutes' => $duration,
                            'clock_out_reason' => 'Standard'
                        ]);
                    }
                } else {
                    // For past days, everyone must clock out eventually
                    if (rand(0, 100) > 5) {
                        // Normal clock out
                        $clockOut = $targetDate->copy()->setTime(18, rand(0, 45));
                        $duration = $clockOut->diffInMinutes($clockIn);
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => $clockOut,
                            'duration_minutes' => $duration,
                            'clock_out_reason' => 'Standard'
                        ]);
                    } else {
                        // Forgot to clock out! (Invalid state)
                        Attendance::create([
                            'user_id' => $u->id,
                            'clock_in' => $clockIn,
                            'clock_out' => null, // Left null
                            'duration_minutes' => null
                        ]);
                    }
                }
            }
        }
    }
}
