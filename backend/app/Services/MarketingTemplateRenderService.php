<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingSetting;
use Illuminate\Support\Carbon;

class MarketingTemplateRenderService
{
    /**
     * Canonical variable list, grouped for the editor's insertion menu.
     */
    public static function variables(): array
    {
        return [
            ['group' => 'Recipient', 'variables' => [
                ['token' => '{{recipient.name}}', 'label' => 'Recipient full name'],
                ['token' => '{{recipient.first_name}}', 'label' => 'Recipient first name'],
                ['token' => '{{recipient.email}}', 'label' => 'Recipient email'],
            ]],
            ['group' => 'Customer', 'variables' => [
                ['token' => '{{customer.name}}', 'label' => 'Customer name'],
                ['token' => '{{customer.company}}', 'label' => 'Customer company'],
                ['token' => '{{customer.email}}', 'label' => 'Customer email'],
                ['token' => '{{customer.phone}}', 'label' => 'Customer phone'],
                ['token' => '{{customer.address}}', 'label' => 'Customer address'],
                ['token' => '{{customer.outstanding_balance}}', 'label' => 'Outstanding balance'],
            ]],
            ['group' => 'Contact', 'variables' => [
                ['token' => '{{contact.name}}', 'label' => 'Contact full name'],
                ['token' => '{{contact.first_name}}', 'label' => 'Contact first name'],
                ['token' => '{{contact.designation}}', 'label' => 'Contact designation'],
                ['token' => '{{contact.email}}', 'label' => 'Contact email'],
                ['token' => '{{contact.phone}}', 'label' => 'Contact phone'],
            ]],
            ['group' => 'Salesperson', 'variables' => [
                ['token' => '{{salesperson.name}}', 'label' => 'Salesperson name'],
                ['token' => '{{salesperson.email}}', 'label' => 'Salesperson email'],
                ['token' => '{{salesperson.phone}}', 'label' => 'Salesperson phone'],
            ]],
            ['group' => 'Company', 'variables' => [
                ['token' => '{{company.name}}', 'label' => 'Your company name'],
                ['token' => '{{company.email}}', 'label' => 'Your company email'],
                ['token' => '{{company.phone}}', 'label' => 'Your company phone'],
                ['token' => '{{company.website}}', 'label' => 'Your company website'],
            ]],
            ['group' => 'Quote', 'variables' => [
                ['token' => '{{quote.number}}', 'label' => 'Latest quote number'],
                ['token' => '{{quote.date}}', 'label' => 'Latest quote date'],
                ['token' => '{{quote.total}}', 'label' => 'Latest quote total'],
                ['token' => '{{quote.status}}', 'label' => 'Latest quote status'],
            ]],
            ['group' => 'Invoice', 'variables' => [
                ['token' => '{{invoice.number}}', 'label' => 'Latest invoice number'],
                ['token' => '{{invoice.date}}', 'label' => 'Latest invoice date'],
                ['token' => '{{invoice.total}}', 'label' => 'Latest invoice total'],
                ['token' => '{{invoice.balance_due}}', 'label' => 'Latest invoice balance due'],
            ]],
            ['group' => 'Dates', 'variables' => [
                ['token' => '{{date.today}}', 'label' => 'Today\'s date'],
                ['token' => '{{date.month}}', 'label' => 'Current month'],
                ['token' => '{{date.year}}', 'label' => 'Current year'],
            ]],
            ['group' => 'System', 'variables' => [
                ['token' => '{{unsubscribe_url}}', 'label' => 'Unsubscribe link'],
            ]],
        ];
    }

    /**
     * Per-variable fallbacks when merge data has no value.
     */
    private static function fallbacks(): array
    {
        return [
            'recipient.first_name' => 'there',
            'recipient.name' => 'there',
        ];
    }

    /**
     * Merge variables into subject + body. $mergeData is a flat token => value
     * map (without braces), e.g. ['recipient.name' => 'John', ...].
     * Date/system tokens are resolved at render time.
     */
    public static function render(?string $html, ?string $subject, array $mergeData, ?string $timezone = null): array
    {
        $now = Carbon::now($timezone ?: config('app.timezone'));

        $data = array_merge($mergeData, [
            'date.today' => $now->format('d M Y'),
            'date.month' => $now->format('F'),
            'date.year' => $now->format('Y'),
        ]);

        $search = [];
        $replace = [];
        foreach ($data as $token => $value) {
            $search[] = '{{' . $token . '}}';
            $replace[] = (string) ($value ?? '');
        }

        $html = str_replace($search, $replace, $html ?? '');
        $subject = str_replace($search, $replace, $subject ?? '');

        // Any remaining known tokens fall back to defaults / empty string
        $pattern = '/\{\{\s*([a-z_]+\.[a-z_]+|unsubscribe_url)\s*\}\}/i';
        $fallbacks = self::fallbacks();
        $clean = function ($matches) use ($fallbacks) {
            return $fallbacks[$matches[1]] ?? '';
        };
        $html = preg_replace_callback($pattern, $clean, $html);
        $subject = preg_replace_callback($pattern, $clean, $subject);

        return ['subject' => $subject, 'html' => $html];
    }

    /**
     * Extract original hrefs from campaign HTML at launch time.
     * Click redirects index into this array.
     */
    public static function extractLinks(?string $html): array
    {
        if (!$html) {
            return [];
        }

        preg_match_all('/<a\s[^>]*href\s*=\s*["\']([^"\']+)["\']/i', $html, $matches);

        $links = [];
        foreach ($matches[1] as $href) {
            if (self::isTrackableLink($href) && !in_array($href, $links, true)) {
                $links[] = $href;
            }
        }

        return $links;
    }

    private static function isTrackableLink(string $href): bool
    {
        if (str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:') || str_starts_with($href, '#')) {
            return false;
        }
        if (str_contains($href, '{{')) {
            return false; // variable link (e.g. unsubscribe_url) — resolved separately
        }
        return true;
    }

    /**
     * Rewrite links to tracking redirects, append the open pixel and the
     * unsubscribe footer. Runs at send time, after render().
     */
    public static function injectTracking(string $html, MarketingCampaignRecipient $recipient, MarketingCampaign $campaign, MarketingSetting $settings): string
    {
        $unsubscribeUrl = self::unsubscribeUrl($recipient);

        // Unsubscribe token may appear in the template itself
        $html = str_replace('{{unsubscribe_url}}', $unsubscribeUrl, $html);

        if ($settings->track_clicks && !empty($campaign->links)) {
            $links = $campaign->links;
            $html = preg_replace_callback(
                '/(<a\s[^>]*href\s*=\s*["\'])([^"\']+)(["\'])/i',
                function ($matches) use ($links, $recipient) {
                    $index = array_search($matches[2], $links, true);
                    if ($index === false) {
                        return $matches[0];
                    }
                    return $matches[1] . url('api/m/c/' . $recipient->token . '/' . $index) . $matches[3];
                },
                $html
            );
        }

        if ($settings->append_unsubscribe_footer) {
            $footer = $settings->unsubscribe_footer_html
                ?: '<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:24px;">You are receiving this email because of your relationship with {{company.name}}. <a href="{{unsubscribe_url}}" style="color:#94a3b8;">Unsubscribe</a></p>';
            $footer = str_replace('{{unsubscribe_url}}', $unsubscribeUrl, $footer);
            $footer = str_replace('{{company.name}}', (string) ($recipient->merge_data['company.name'] ?? ''), $footer);

            if (stripos($html, '</body>') !== false) {
                $html = str_ireplace('</body>', $footer . '</body>', $html);
            } else {
                $html .= $footer;
            }
        }

        if ($settings->track_opens) {
            $pixel = '<img src="' . url('api/m/o/' . $recipient->token) . '" width="1" height="1" alt="" style="display:none;" />';
            if (stripos($html, '</body>') !== false) {
                $html = str_ireplace('</body>', $pixel . '</body>', $html);
            } else {
                $html .= $pixel;
            }
        }

        return $html;
    }

    public static function unsubscribeUrl(MarketingCampaignRecipient $recipient): string
    {
        return url('api/m/u/' . $recipient->token);
    }

    /**
     * Realistic sample merge data for previews.
     */
    public static function sampleMergeData(?int $companyId = null): array
    {
        $company = $companyId ? \App\Models\Company::find($companyId) : null;

        return [
            'recipient.name' => 'John Carter',
            'recipient.first_name' => 'John',
            'recipient.email' => 'john.carter@example.com',
            'customer.name' => 'John Carter',
            'customer.company' => 'Falcon Trading LLC',
            'customer.email' => 'john.carter@example.com',
            'customer.phone' => '+971 50 123 4567',
            'customer.address' => 'Office 402, Business Bay, Dubai',
            'customer.outstanding_balance' => '4,250.00',
            'contact.name' => 'John Carter',
            'contact.first_name' => 'John',
            'contact.designation' => 'Procurement Manager',
            'contact.email' => 'john.carter@example.com',
            'contact.phone' => '+971 50 123 4567',
            'salesperson.name' => 'Sara Ahmed',
            'salesperson.email' => 'sara@yourcompany.com',
            'salesperson.phone' => '+971 55 765 4321',
            'company.name' => $company->name ?? 'Your Company',
            'company.email' => $company->email ?? 'info@yourcompany.com',
            'company.phone' => $company->phone ?? '+971 4 000 0000',
            'company.website' => $company->website ?? 'www.yourcompany.com',
            'quote.number' => 'QT-20260701-001',
            'quote.date' => '01 Jul 2026',
            'quote.total' => 'AED 12,500.00',
            'quote.status' => 'Sent',
            'invoice.number' => 'INV-20260615-003',
            'invoice.date' => '15 Jun 2026',
            'invoice.total' => 'AED 8,900.00',
            'invoice.balance_due' => 'AED 2,400.00',
            'unsubscribe_url' => '#unsubscribe-preview',
        ];
    }
}
