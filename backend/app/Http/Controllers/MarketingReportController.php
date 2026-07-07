<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MarketingReportController extends Controller
{
    public function overview(Request $request)
    {
        $days = min((int) $request->get('days', 30), 365);
        $since = Carbon::now()->subDays($days);

        $totals = MarketingCampaignRecipient::selectRaw(
            "COUNT(*) as recipients,
             SUM(CASE WHEN sent_at IS NOT NULL THEN 1 ELSE 0 END) as sent,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
             SUM(CASE WHEN status IN ('bounced','spam') THEN 1 ELSE 0 END) as bounced,
             SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
             SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
             SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked,
             SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) as unsubscribed"
        )
            ->where('created_at', '>=', $since)
            ->first();

        $sent = (int) $totals->sent;

        // Per-campaign comparison
        $campaigns = MarketingCampaign::whereNotNull('launched_at')
            ->where('launched_at', '>=', $since)
            ->orderByDesc('launched_at')
            ->limit(20)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'status' => $c->status,
                    'launched_at' => $c->launched_at,
                    'total_recipients' => $c->total_recipients,
                    'sent' => $c->sent_count,
                    'delivery_rate' => $c->total_recipients > 0 ? round($c->sent_count / max($c->total_recipients - $c->skipped_count, 1) * 100, 1) : 0,
                    'open_rate' => $c->sent_count > 0 ? round($c->opened_count / $c->sent_count * 100, 1) : 0,
                    'click_rate' => $c->sent_count > 0 ? round($c->clicked_count / $c->sent_count * 100, 1) : 0,
                    'bounce_rate' => $c->sent_count > 0 ? round($c->bounced_count / max($c->sent_count + $c->bounced_count, 1) * 100, 1) : 0,
                    'unsubscribed' => $c->unsubscribed_count,
                ];
            });

        // Recipient domain breakdown of sent mail
        $domains = MarketingCampaignRecipient::selectRaw("SUBSTRING_INDEX(email, '@', -1) as domain, COUNT(*) as total")
            ->whereNotNull('sent_at')
            ->where('sent_at', '>=', $since)
            ->groupBy('domain')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json([
            'totals' => [
                'recipients' => (int) $totals->recipients,
                'sent' => $sent,
                'failed' => (int) $totals->failed,
                'bounced' => (int) $totals->bounced,
                'skipped' => (int) $totals->skipped,
                'opened' => (int) $totals->opened,
                'clicked' => (int) $totals->clicked,
                'unsubscribed' => (int) $totals->unsubscribed,
                'open_rate' => $sent > 0 ? round($totals->opened / $sent * 100, 1) : 0,
                'click_rate' => $sent > 0 ? round($totals->clicked / $sent * 100, 1) : 0,
                'bounce_rate' => $sent > 0 ? round($totals->bounced / max($sent + $totals->bounced, 1) * 100, 1) : 0,
                'unsubscribe_rate' => $sent > 0 ? round($totals->unsubscribed / $sent * 100, 1) : 0,
            ],
            'campaigns' => $campaigns,
            'domains' => $domains,
        ]);
    }

    public function trends(Request $request)
    {
        $days = min((int) $request->get('days', 30), 365);
        $since = Carbon::now()->subDays($days);

        $sends = MarketingCampaignRecipient::selectRaw('DATE(sent_at) as date, COUNT(*) as sent')
            ->whereNotNull('sent_at')
            ->where('sent_at', '>=', $since)
            ->groupByRaw('DATE(sent_at)')
            ->pluck('sent', 'date');

        $events = MarketingEvent::selectRaw('DATE(created_at) as date, type, COUNT(*) as c')
            ->whereIn('type', ['open', 'click', 'unsubscribe', 'bounce'])
            ->where('created_at', '>=', $since)
            ->groupByRaw('DATE(created_at), type')
            ->get()
            ->groupBy('date');

        $trend = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->toDateString();
            $dayEvents = $events->get($date, collect())->keyBy('type');
            $trend[] = [
                'date' => $date,
                'sent' => (int) ($sends[$date] ?? 0),
                'opens' => (int) ($dayEvents['open']->c ?? 0),
                'clicks' => (int) ($dayEvents['click']->c ?? 0),
                'unsubscribes' => (int) ($dayEvents['unsubscribe']->c ?? 0),
                'bounces' => (int) ($dayEvents['bounce']->c ?? 0),
            ];
        }

        return response()->json(['data' => $trend]);
    }

    public function campaign(Request $request, MarketingCampaign $marketingCampaign)
    {
        $marketingCampaign->recalcStatusCounters();
        $campaign = $marketingCampaign->fresh();

        // Hourly timeline of sends/opens/clicks for this campaign
        $timeline = MarketingEvent::selectRaw("DATE_FORMAT(created_at, '%Y-%m-%d %H:00') as hour, type, COUNT(*) as c")
            ->where('campaign_id', $campaign->id)
            ->whereIn('type', ['sent', 'open', 'click', 'unsubscribe'])
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m-%d %H:00'), type")
            ->orderBy('hour')
            ->get()
            ->groupBy('hour')
            ->map(function ($rows, $hour) {
                $byType = $rows->keyBy('type');
                return [
                    'hour' => $hour,
                    'sent' => (int) ($byType['sent']->c ?? 0),
                    'opens' => (int) ($byType['open']->c ?? 0),
                    'clicks' => (int) ($byType['click']->c ?? 0),
                    'unsubscribes' => (int) ($byType['unsubscribe']->c ?? 0),
                ];
            })
            ->values();

        // Top clicked links
        $topLinks = MarketingEvent::selectRaw('url, COUNT(*) as clicks')
            ->where('campaign_id', $campaign->id)
            ->where('type', 'click')
            ->groupBy('url')
            ->orderByDesc('clicks')
            ->limit(10)
            ->get();

        $sendable = max($campaign->total_recipients - $campaign->skipped_count, 1);

        return response()->json([
            'campaign' => $campaign,
            'rates' => [
                'delivery_rate' => round($campaign->sent_count / $sendable * 100, 1),
                'open_rate' => $campaign->sent_count > 0 ? round($campaign->opened_count / $campaign->sent_count * 100, 1) : 0,
                'click_rate' => $campaign->sent_count > 0 ? round($campaign->clicked_count / $campaign->sent_count * 100, 1) : 0,
                'bounce_rate' => round($campaign->bounced_count / $sendable * 100, 1),
                'unsubscribe_rate' => $campaign->sent_count > 0 ? round($campaign->unsubscribed_count / $campaign->sent_count * 100, 1) : 0,
            ],
            'timeline' => $timeline,
            'top_links' => $topLinks,
            'skip_breakdown' => MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('campaign_id', $campaign->id)
                ->where('status', 'skipped')
                ->selectRaw('skipped_reason, COUNT(*) as c')
                ->groupBy('skipped_reason')
                ->pluck('c', 'skipped_reason'),
        ]);
    }
}
