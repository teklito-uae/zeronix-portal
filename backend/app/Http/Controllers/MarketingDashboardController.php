<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingEvent;
use App\Models\MarketingSuppression;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MarketingDashboardController extends Controller
{
    public function index(Request $request)
    {
        $since30 = Carbon::now()->subDays(30);

        $sent30 = MarketingCampaignRecipient::whereNotNull('sent_at')->where('sent_at', '>=', $since30)->count();
        $opened30 = MarketingCampaignRecipient::whereNotNull('opened_at')->where('sent_at', '>=', $since30)->count();
        $clicked30 = MarketingCampaignRecipient::whereNotNull('clicked_at')->where('sent_at', '>=', $since30)->count();

        $queueDepth = MarketingCampaignRecipient::whereIn('status', ['pending', 'queued', 'sending', 'deferred'])->count();

        $activeCampaigns = MarketingCampaign::whereIn('status', ['sending', 'scheduled', 'paused'])->count();

        // Daily send/open/click trend for the last 30 days
        $trend = MarketingCampaignRecipient::selectRaw(
            'DATE(sent_at) as date, COUNT(*) as sent, COUNT(opened_at) as opened, COUNT(clicked_at) as clicked'
        )
            ->whereNotNull('sent_at')
            ->where('sent_at', '>=', $since30)
            ->groupByRaw('DATE(sent_at)')
            ->orderBy('date')
            ->get();

        $recentCampaigns = MarketingCampaign::with('user:id,name')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'sent_30d' => $sent30,
                'open_rate_30d' => $sent30 > 0 ? round($opened30 / $sent30 * 100, 1) : 0,
                'click_rate_30d' => $sent30 > 0 ? round($clicked30 / $sent30 * 100, 1) : 0,
                'active_campaigns' => $activeCampaigns,
                'queue_depth' => $queueDepth,
                'suppressed_total' => MarketingSuppression::count(),
                'unsubscribes_30d' => MarketingEvent::where('type', 'unsubscribe')->where('created_at', '>=', $since30)->count(),
            ],
            'trend' => $trend,
            'recent_campaigns' => $recentCampaigns,
        ]);
    }
}
