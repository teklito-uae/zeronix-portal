<?php

namespace App\Services;

use App\Models\MarketingTemplate;

class MarketingTemplateSeederService
{
    /**
     * Seed the built-in templates for a company if it has none yet.
     * Runs lazily from MarketingTemplateController::index (built-ins are
     * per-company copies the company can freely edit).
     */
    public static function seedForCompany(int $companyId): void
    {
        $exists = MarketingTemplate::withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->where('is_builtin', true)
            ->exists();

        if ($exists) {
            return;
        }

        foreach (self::builtins() as $template) {
            MarketingTemplate::withoutGlobalScope('company')->create(array_merge($template, [
                'company_id' => $companyId,
                'is_builtin' => true,
                'is_active' => true,
                'channel' => 'email',
                'current_version' => 1,
            ]));
        }
    }

    private static function wrap(string $title, string $body): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{$title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background-color:#4F46E5;padding:20px 32px;">
<span style="color:#ffffff;font-size:18px;font-weight:bold;">{{company.name}}</span>
</td></tr>
<tr><td style="padding:32px;color:#334155;font-size:14px;line-height:1.7;">
{$body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
{{company.name}} · {{company.phone}} · {{company.email}}<br />
{{company.website}}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }

    private static function builtins(): array
    {
        return [
            [
                'name' => 'Welcome Email',
                'category' => 'welcome',
                'subject' => 'Welcome to {{company.name}}, {{recipient.first_name}}!',
                'preheader' => 'We are delighted to have you on board.',
                'body_html' => self::wrap('Welcome', <<<HTML
<h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome aboard, {{recipient.first_name}}!</h2>
<p>Thank you for choosing {{company.name}}. We are delighted to have you with us and look forward to supporting your business every step of the way.</p>
<p>Here is what you can expect from us:</p>
<ul style="padding-left:20px;">
<li>Dedicated account support from our team</li>
<li>Competitive pricing and fast turnaround on quotations</li>
<li>Reliable delivery and after-sales service</li>
</ul>
<p>If you have any questions, simply reply to this email or reach us at {{company.phone}} — we are always happy to help.</p>
<p style="margin-top:24px;">Warm regards,<br /><strong>The {{company.name}} Team</strong></p>
HTML),
            ],
            [
                'name' => 'Company Introduction',
                'category' => 'introduction',
                'subject' => 'Introducing {{company.name}} — your trusted partner',
                'preheader' => 'Discover how we can support your business.',
                'body_html' => self::wrap('Introduction', <<<HTML
<h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Hello {{recipient.first_name}},</h2>
<p>My name is {{salesperson.name}} and I am reaching out on behalf of {{company.name}}.</p>
<p>We specialise in providing quality products and services to businesses like yours, with a focus on dependable supply, competitive pricing, and responsive support.</p>
<p>I would love the opportunity to learn more about your requirements and show you how we can add value. Would you be open to a quick call this week?</p>
<p>You can reach me directly at {{salesperson.email}} or {{salesperson.phone}}.</p>
<p style="margin-top:24px;">Best regards,<br /><strong>{{salesperson.name}}</strong><br />{{company.name}}</p>
HTML),
            ],
            [
                'name' => 'Quotation Follow-up',
                'category' => 'follow_up',
                'subject' => 'Following up on quotation {{quote.number}}',
                'preheader' => 'A quick follow-up on the quotation we shared with you.',
                'body_html' => self::wrap('Quotation Follow-up', <<<HTML
<h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Hello {{recipient.first_name}},</h2>
<p>I hope you are doing well. I wanted to follow up on the quotation we sent you recently:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin:16px 0;">
<tr><td style="padding:16px;font-size:14px;color:#334155;">
<strong>Quotation:</strong> {{quote.number}}<br />
<strong>Date:</strong> {{quote.date}}<br />
<strong>Total:</strong> {{quote.total}}
</td></tr>
</table>
<p>Please let us know if you have any questions, or if you would like us to revise any part of the offer. We are happy to work with you to find the right fit.</p>
<p>I look forward to hearing from you.</p>
<p style="margin-top:24px;">Best regards,<br /><strong>{{salesperson.name}}</strong><br />{{salesperson.phone}}</p>
HTML),
            ],
            [
                'name' => 'AMC Renewal Reminder',
                'category' => 'renewal',
                'subject' => 'Your AMC with {{company.name}} is due for renewal',
                'preheader' => 'Renew now to keep your coverage uninterrupted.',
                'body_html' => self::wrap('AMC Renewal', <<<HTML
<h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Dear {{recipient.first_name}},</h2>
<p>This is a friendly reminder that your Annual Maintenance Contract with {{company.name}} is approaching its renewal date.</p>
<p>Renewing on time ensures uninterrupted support, priority service response, and continued coverage for your equipment.</p>
<p>To renew, or to discuss an updated plan that better fits your current needs, please contact your account manager {{salesperson.name}} at {{salesperson.email}} or {{salesperson.phone}}.</p>
<p>Thank you for your continued trust in {{company.name}}.</p>
<p style="margin-top:24px;">Kind regards,<br /><strong>The {{company.name}} Team</strong></p>
HTML),
            ],
            [
                'name' => 'Promotional Campaign',
                'category' => 'promotional',
                'subject' => '{{recipient.first_name}}, a special offer from {{company.name}}',
                'preheader' => 'Limited-time offer — do not miss out.',
                'body_html' => self::wrap('Special Offer', <<<HTML
<h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">A special offer for you, {{recipient.first_name}}</h2>
<p>As a valued contact of {{company.name}}, we are excited to share an exclusive limited-time offer with you.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
<tr><td align="center" style="background-color:#eef2ff;border:1px dashed #4F46E5;border-radius:8px;padding:24px;">
<span style="font-size:22px;font-weight:bold;color:#4F46E5;">Your Offer Headline Here</span><br />
<span style="font-size:13px;color:#64748b;">Valid until the end of {{date.month}} {{date.year}}</span>
</td></tr>
</table>
<p>Replace this paragraph with the details of your promotion — what is included, who it applies to, and how to claim it.</p>
<p>To take advantage of this offer, reply to this email or call us at {{company.phone}}.</p>
<p style="margin-top:24px;">Best regards,<br /><strong>The {{company.name}} Team</strong></p>
HTML),
            ],
        ];
    }
}
