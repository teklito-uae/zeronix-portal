<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingEvent;
use App\Models\MarketingSuppression;
use Illuminate\Http\Request;

/**
 * Public (unauthenticated) tracking endpoints. Recipients are located by
 * their unguessable 40-char token; no tenant auth context exists here, so
 * every write sets company_id explicitly.
 */
class MarketingTrackingController extends Controller
{
    private const PIXEL = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b";

    public function open(Request $request, string $token)
    {
        $recipient = $this->findRecipient($token);

        if ($recipient) {
            MarketingEvent::create([
                'company_id' => $recipient->company_id,
                'campaign_id' => $recipient->campaign_id,
                'recipient_id' => $recipient->id,
                'type' => 'open',
                'ip' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
                'created_at' => now(),
            ]);

            $updates = [
                'open_count' => $recipient->open_count + 1,
                'last_opened_at' => now(),
                'updated_at' => now(),
            ];

            $campaignIncrements = ['open_events_count'];
            if (!$recipient->opened_at) {
                $updates['opened_at'] = now();
                $campaignIncrements[] = 'opened_count';
            }

            $recipient->newQueryWithoutScopes()->whereKey($recipient->id)->update($updates);
            foreach ($campaignIncrements as $column) {
                MarketingCampaign::withoutGlobalScope('company')->whereKey($recipient->campaign_id)->increment($column);
            }
        }

        return response(self::PIXEL, 200, [
            'Content-Type' => 'image/gif',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function click(Request $request, string $token, int $link)
    {
        $recipient = $this->findRecipient($token);
        if (!$recipient) {
            return response()->json(['message' => 'Link not found'], 404);
        }

        $campaign = MarketingCampaign::withoutGlobalScope('company')->find($recipient->campaign_id);
        $links = $campaign?->links ?? [];

        if (!isset($links[$link])) {
            return response()->json(['message' => 'Link not found'], 404);
        }

        $url = $links[$link];

        MarketingEvent::create([
            'company_id' => $recipient->company_id,
            'campaign_id' => $recipient->campaign_id,
            'recipient_id' => $recipient->id,
            'type' => 'click',
            'url' => $url,
            'ip' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);

        $updates = [
            'click_count' => $recipient->click_count + 1,
            'updated_at' => now(),
        ];

        $campaignIncrements = ['click_events_count'];
        if (!$recipient->clicked_at) {
            $updates['clicked_at'] = now();
            $campaignIncrements[] = 'clicked_count';
        }

        // A click implies the email was opened, even if the pixel was blocked
        if (!$recipient->opened_at) {
            $updates['opened_at'] = now();
            $updates['last_opened_at'] = now();
            $campaignIncrements[] = 'opened_count';
        }

        $recipient->newQueryWithoutScopes()->whereKey($recipient->id)->update($updates);
        foreach ($campaignIncrements as $column) {
            MarketingCampaign::withoutGlobalScope('company')->whereKey($recipient->campaign_id)->increment($column);
        }

        return redirect()->away($url);
    }

    public function unsubscribeShow(Request $request, string $token)
    {
        $recipient = $this->findRecipient($token);
        if (!$recipient) {
            return response($this->page('Link expired', '<p>This unsubscribe link is not valid.</p>'), 404)
                ->header('Content-Type', 'text/html');
        }

        if ($recipient->unsubscribed_at) {
            return response($this->page('Already unsubscribed', '<p><strong>' . e($recipient->email) . '</strong> is already unsubscribed.</p>'))
                ->header('Content-Type', 'text/html');
        }

        $body = '<p>Unsubscribe <strong>' . e($recipient->email) . '</strong> from marketing emails?</p>'
            . '<form method="POST" action="' . url('api/m/u/' . e($token)) . '">'
            . '<button type="submit" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:10px 24px;font-size:14px;cursor:pointer;">Unsubscribe</button>'
            . '</form>';

        return response($this->page('Unsubscribe', $body))->header('Content-Type', 'text/html');
    }

    public function unsubscribeConfirm(Request $request, string $token)
    {
        $recipient = $this->findRecipient($token);
        if (!$recipient) {
            return response($this->page('Link expired', '<p>This unsubscribe link is not valid.</p>'), 404)
                ->header('Content-Type', 'text/html');
        }

        if (!$recipient->unsubscribed_at) {
            MarketingSuppression::withoutGlobalScope('company')->firstOrCreate(
                ['company_id' => $recipient->company_id, 'kind' => 'email', 'value' => $recipient->email],
                ['type' => 'unsubscribe', 'source_campaign_id' => $recipient->campaign_id]
            );

            MarketingEvent::create([
                'company_id' => $recipient->company_id,
                'campaign_id' => $recipient->campaign_id,
                'recipient_id' => $recipient->id,
                'type' => 'unsubscribe',
                'ip' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
                'created_at' => now(),
            ]);

            $recipient->newQueryWithoutScopes()->whereKey($recipient->id)->update([
                'status' => $recipient->status === 'sent' ? 'unsubscribed' : $recipient->status,
                'unsubscribed_at' => now(),
                'updated_at' => now(),
            ]);

            MarketingCampaign::withoutGlobalScope('company')->whereKey($recipient->campaign_id)->increment('unsubscribed_count');
        }

        return response($this->page('Unsubscribed', '<p><strong>' . e($recipient->email) . '</strong> has been unsubscribed. You will not receive further marketing emails.</p>'))
            ->header('Content-Type', 'text/html');
    }

    private function findRecipient(string $token): ?MarketingCampaignRecipient
    {
        if (strlen($token) !== 40) {
            return null;
        }

        return MarketingCampaignRecipient::withoutGlobalScope('company')->where('token', $token)->first();
    }

    private function page(string $title, string $body): string
    {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>' . e($title) . '</title></head>'
            . '<body style="margin:0;padding:48px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">'
            . '<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;text-align:center;color:#334155;font-size:14px;line-height:1.6;">'
            . '<h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">' . e($title) . '</h2>'
            . $body
            . '</div></body></html>';
    }
}
