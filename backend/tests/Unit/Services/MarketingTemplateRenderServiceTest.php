<?php

namespace Tests\Unit\Services;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingSetting;
use App\Services\MarketingTemplateRenderService as Renderer;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Pure rendering/tracking-injection behavior — no DB rows are created, the
 * models involved are instantiated unsaved so their casts still apply.
 */
class MarketingTemplateRenderServiceTest extends TestCase
{
    private function recipient(array $overrides = []): MarketingCampaignRecipient
    {
        return new MarketingCampaignRecipient(array_merge([
            'token' => 'tok123',
            'merge_data' => ['company.name' => 'Zeronix'],
        ], $overrides));
    }

    private function settings(array $overrides = []): MarketingSetting
    {
        return new MarketingSetting(array_merge([
            'track_opens' => false,
            'track_clicks' => false,
            'append_unsubscribe_footer' => false,
        ], $overrides));
    }

    public function test_variables_expose_unique_tokens_grouped_for_the_editor(): void
    {
        $groups = Renderer::variables();

        $this->assertNotEmpty($groups);

        $tokens = [];
        foreach ($groups as $group) {
            $this->assertArrayHasKey('group', $group);
            $this->assertNotEmpty($group['variables']);
            foreach ($group['variables'] as $variable) {
                $this->assertMatchesRegularExpression('/^\{\{[a-z_.]+\}\}$/', $variable['token']);
                $this->assertNotEmpty($variable['label']);
                $tokens[] = $variable['token'];
            }
        }

        $this->assertSame($tokens, array_unique($tokens));
        $this->assertContains('{{recipient.name}}', $tokens);
        $this->assertContains('{{unsubscribe_url}}', $tokens);
    }

    public function test_render_substitutes_merge_data_in_subject_and_body(): void
    {
        $result = Renderer::render(
            '<p>Hello {{recipient.first_name}} at {{customer.company}}</p>',
            'Quote for {{customer.company}}',
            ['recipient.first_name' => 'John', 'customer.company' => 'Falcon Trading LLC']
        );

        $this->assertSame('Quote for Falcon Trading LLC', $result['subject']);
        $this->assertSame('<p>Hello John at Falcon Trading LLC</p>', $result['html']);
    }

    public function test_render_resolves_date_tokens_in_the_given_timezone(): void
    {
        Carbon::setTestNow('2026-03-04 22:30:00', 'UTC');

        try {
            $result = Renderer::render('{{date.today}} / {{date.month}} / {{date.year}}', null, [], 'Asia/Dubai');
        } finally {
            Carbon::setTestNow();
        }

        $this->assertSame('05 Mar 2026 / March / 2026', $result['html']);
    }

    public function test_render_applies_fallbacks_for_missing_recipient_name_tokens(): void
    {
        $result = Renderer::render('Hi {{recipient.first_name}},', 'Hello {{recipient.name}}', []);

        $this->assertSame('Hi there,', $result['html']);
        $this->assertSame('Hello there', $result['subject']);
    }

    public function test_render_strips_unknown_tokens_and_tolerates_whitespace_inside_braces(): void
    {
        $result = Renderer::render('A{{ customer.phone }}B{{unsubscribe_url}}C', null, []);

        $this->assertSame('ABC', $result['html']);
    }

    public function test_render_treats_null_merge_values_as_empty_strings(): void
    {
        $result = Renderer::render('[{{customer.phone}}]', null, ['customer.phone' => null]);

        $this->assertSame('[]', $result['html']);
    }

    public function test_render_handles_null_html_and_subject(): void
    {
        $this->assertSame(['subject' => '', 'html' => ''], Renderer::render(null, null, []));
    }

    public function test_extract_links_returns_unique_trackable_hrefs_only(): void
    {
        $html = '<a href="https://example.com/a">a</a>'
            . '<a class="x" href=\'https://example.com/b\'>b</a>'
            . '<a href="https://example.com/a">dup</a>'
            . '<a href="mailto:sales@example.com">mail</a>'
            . '<a href="tel:+971500000000">tel</a>'
            . '<a href="#top">anchor</a>'
            . '<a href="{{unsubscribe_url}}">unsub</a>';

        $this->assertSame(
            ['https://example.com/a', 'https://example.com/b'],
            Renderer::extractLinks($html)
        );
    }

    public function test_extract_links_returns_empty_array_for_empty_html(): void
    {
        $this->assertSame([], Renderer::extractLinks(null));
        $this->assertSame([], Renderer::extractLinks(''));
        $this->assertSame([], Renderer::extractLinks('<p>no links</p>'));
    }

    public function test_inject_tracking_replaces_the_unsubscribe_token_even_when_all_tracking_is_off(): void
    {
        $recipient = $this->recipient();

        $html = Renderer::injectTracking(
            '<p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
            $recipient,
            new MarketingCampaign(),
            $this->settings()
        );

        $this->assertSame('<p><a href="' . url('api/m/u/tok123') . '">Unsubscribe</a></p>', $html);
    }

    public function test_inject_tracking_rewrites_only_known_campaign_links_when_click_tracking_is_on(): void
    {
        $recipient = $this->recipient();
        $campaign = new MarketingCampaign(['links' => ['https://example.com/a', 'https://example.com/b']]);

        $html = Renderer::injectTracking(
            '<a href="https://example.com/b">b</a><a href="https://other.example/z">z</a>',
            $recipient,
            $campaign,
            $this->settings(['track_clicks' => true])
        );

        $this->assertStringContainsString('href="' . url('api/m/c/tok123/1') . '"', $html);
        $this->assertStringContainsString('href="https://other.example/z"', $html);
    }

    public function test_inject_tracking_leaves_links_untouched_when_click_tracking_is_off(): void
    {
        $html = Renderer::injectTracking(
            '<a href="https://example.com/a">a</a>',
            $this->recipient(),
            new MarketingCampaign(['links' => ['https://example.com/a']]),
            $this->settings(['track_clicks' => false])
        );

        $this->assertSame('<a href="https://example.com/a">a</a>', $html);
    }

    public function test_inject_tracking_appends_the_default_unsubscribe_footer_with_resolved_tokens(): void
    {
        $html = Renderer::injectTracking(
            '<html><body><p>Hi</p></body></html>',
            $this->recipient(),
            new MarketingCampaign(),
            $this->settings(['append_unsubscribe_footer' => true])
        );

        $this->assertStringContainsString('Zeronix', $html);
        $this->assertStringContainsString(url('api/m/u/tok123'), $html);
        $this->assertStringNotContainsString('{{', $html);
        $this->assertStringEndsWith('</body></html>', $html);
    }

    public function test_inject_tracking_uses_a_custom_footer_and_appends_when_there_is_no_body_tag(): void
    {
        $html = Renderer::injectTracking(
            '<p>Hi</p>',
            $this->recipient(),
            new MarketingCampaign(),
            $this->settings([
                'append_unsubscribe_footer' => true,
                'unsubscribe_footer_html' => '<span>Bye from {{company.name}}</span>',
            ])
        );

        $this->assertSame('<p>Hi</p><span>Bye from Zeronix</span>', $html);
    }

    public function test_inject_tracking_adds_the_open_pixel_before_the_closing_body_tag(): void
    {
        $html = Renderer::injectTracking(
            '<html><body><p>Hi</p></body></html>',
            $this->recipient(),
            new MarketingCampaign(),
            $this->settings(['track_opens' => true])
        );

        $this->assertStringContainsString('<img src="' . url('api/m/o/tok123') . '" width="1" height="1"', $html);
        $this->assertStringEndsWith('</body></html>', $html);
    }

    public function test_inject_tracking_appends_the_open_pixel_when_there_is_no_body_tag(): void
    {
        $html = Renderer::injectTracking(
            '<p>Hi</p>',
            $this->recipient(),
            new MarketingCampaign(),
            $this->settings(['track_opens' => true])
        );

        $this->assertStringStartsWith('<p>Hi</p><img src="', $html);
    }

    public function test_unsubscribe_url_is_built_from_the_recipient_token(): void
    {
        $this->assertSame(url('api/m/u/tok123'), Renderer::unsubscribeUrl($this->recipient()));
    }

    public function test_sample_merge_data_covers_every_advertised_variable_token(): void
    {
        $sample = Renderer::sampleMergeData();

        foreach (Renderer::variables() as $group) {
            foreach ($group['variables'] as $variable) {
                $token = trim($variable['token'], '{}');
                if (str_starts_with($token, 'date.')) {
                    continue; // resolved at render time, not part of merge data
                }
                $this->assertArrayHasKey($token, $sample);
            }
        }

        $this->assertSame('Your Company', $sample['company.name']);
        $this->assertStringContainsString('USD', $sample['quote.total']);
    }

    public function test_a_rendered_sample_preview_leaves_no_unresolved_tokens(): void
    {
        $body = '';
        foreach (Renderer::variables() as $group) {
            foreach ($group['variables'] as $variable) {
                $body .= $variable['token'] . ' ';
            }
        }

        $result = Renderer::render($body, 'Preview {{recipient.name}}', Renderer::sampleMergeData());

        $this->assertStringNotContainsString('{{', $result['html']);
        $this->assertSame('Preview John Carter', $result['subject']);
    }
}
