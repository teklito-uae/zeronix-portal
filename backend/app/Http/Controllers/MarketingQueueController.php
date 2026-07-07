<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaignRecipient;
use Illuminate\Http\Request;

class MarketingQueueController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketingCampaignRecipient::with(['campaign:id,name,status', 'smtpAccount:id,label']);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        } else {
            // Default queue view: rows that are or were in the pipeline
            $query->whereIn('status', ['pending', 'queued', 'sending', 'deferred', 'failed', 'bounced']);
        }

        if ($request->filled('campaign_id')) {
            $query->where('campaign_id', $request->campaign_id);
        }

        $rows = $query->orderByDesc('updated_at')->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        // Queue stats for the header tiles
        $stats = MarketingCampaignRecipient::selectRaw('status, COUNT(*) as c')
            ->whereIn('status', ['pending', 'queued', 'sending', 'deferred', 'failed', 'bounced'])
            ->groupBy('status')
            ->pluck('c', 'status');

        return response()->json([
            'data' => $rows->items(),
            'total' => $rows->total(),
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(),
            'stats' => $stats,
        ]);
    }

    public function retry(Request $request, MarketingCampaignRecipient $recipient)
    {
        if (!in_array($recipient->status, ['failed', 'deferred', 'bounced', 'skipped'], true)) {
            return response()->json(['message' => 'Only failed, deferred, bounced or skipped messages can be retried'], 422);
        }

        $recipient->update([
            'status' => 'pending',
            'skipped_reason' => null,
            'attempts' => 0,
            'last_error' => null,
            'queued_at' => null,
        ]);

        $recipient->campaign?->recalcStatusCounters();

        return response()->json(['message' => 'Message queued for retry (released on the next tick)']);
    }

    public function cancelMessage(Request $request, MarketingCampaignRecipient $recipient)
    {
        if (!in_array($recipient->status, ['pending', 'queued', 'deferred'], true)) {
            return response()->json(['message' => 'Only pending, queued or deferred messages can be cancelled'], 422);
        }

        $recipient->update(['status' => 'skipped', 'skipped_reason' => 'cancelled']);

        $recipient->campaign?->recalcStatusCounters();

        return response()->json(['message' => 'Message cancelled']);
    }
}
