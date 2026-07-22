<?php

namespace App\Http\Controllers;

use App\Jobs\PrepareMarketingCampaignJob;
use App\Mail\MarketingCampaignMail;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Services\MarketingAudienceService;
use App\Services\MarketingMailerService;
use App\Services\MarketingTemplateRenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class MarketingCampaignController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketingCampaign::with(['user:id,name', 'template:id,name']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('schedule_type') && $request->schedule_type !== 'all') {
            $query->where('schedule_type', $request->schedule_type);
        }

        $campaigns = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $campaigns->items(),
            'total' => $campaigns->total(),
            'current_page' => $campaigns->currentPage(),
            'last_page' => $campaigns->lastPage(),
            'per_page' => $campaigns->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCampaign($request);

        $campaign = MarketingCampaign::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'status' => 'draft',
        ]));

        return response()->json($campaign, 201);
    }

    public function show(Request $request, MarketingCampaign $marketingCampaign)
    {
        $marketingCampaign->recalcStatusCounters();

        return response()->json($marketingCampaign->fresh()->load(['user:id,name', 'template:id,name', 'smtpAccount:id,label']));
    }

    public function update(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (!in_array($marketingCampaign->status, ['draft', 'scheduled'], true)) {
            return response()->json(['message' => 'Only draft or scheduled campaigns can be edited'], 422);
        }

        $validated = $this->validateCampaign($request);

        $marketingCampaign->update($validated);

        return response()->json($marketingCampaign->fresh());
    }

    public function destroy(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (in_array($marketingCampaign->status, ['sending'], true)) {
            return response()->json(['message' => 'Pause or cancel the campaign before deleting it'], 422);
        }

        $marketingCampaign->delete();

        return response()->json(['message' => 'Campaign deleted']);
    }

    public function launch(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (!in_array($marketingCampaign->status, ['draft'], true)) {
            return response()->json(['message' => 'Only draft campaigns can be launched'], 422);
        }

        if (!$marketingCampaign->template_id && !$marketingCampaign->body_html) {
            return response()->json(['message' => 'Add content (template or custom body) before launching'], 422);
        }

        $hasAudience = !empty($marketingCampaign->audience_config['sources'])
            || $marketingCampaign->recipients()->exists(); // CSV-imported rows

        if (!$hasAudience) {
            return response()->json(['message' => 'Select an audience before launching'], 422);
        }

        if (!MarketingMailerService::pickAccount($marketingCampaign->company_id, $marketingCampaign->smtp_account_id)) {
            return response()->json(['message' => 'No active SMTP account available. Add one in Marketing Settings.'], 422);
        }

        // Duplicate-campaign protection: same template launched recently
        if (!$request->boolean('force') && $marketingCampaign->template_id) {
            $settings = \App\Models\MarketingSetting::forCompany($marketingCampaign->company_id);
            if ($settings->duplicate_protection_days > 0) {
                $recent = MarketingCampaign::where('template_id', $marketingCampaign->template_id)
                    ->where('id', '!=', $marketingCampaign->id)
                    ->whereNotNull('launched_at')
                    ->where('launched_at', '>=', Carbon::now()->subDays($settings->duplicate_protection_days))
                    ->latest('launched_at')
                    ->first();

                if ($recent) {
                    return response()->json([
                        'message' => "The campaign \"{$recent->name}\" used this template on " . $recent->launched_at->format('d M Y') . '. Recipients already emailed will be skipped. Launch anyway?',
                        'requires_confirmation' => true,
                    ], 409);
                }
            }
        }

        $marketingCampaign->update([
            'status' => $marketingCampaign->schedule_type === 'scheduled' ? 'scheduled' : 'sending',
            'launched_at' => now(),
        ]);

        PrepareMarketingCampaignJob::dispatch($marketingCampaign->id);

        return response()->json(['message' => 'Campaign launched', 'campaign' => $marketingCampaign->fresh()]);
    }

    public function pause(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (!in_array($marketingCampaign->status, ['sending', 'scheduled'], true)) {
            return response()->json(['message' => 'Only sending or scheduled campaigns can be paused'], 422);
        }

        $marketingCampaign->update(['status' => 'paused']);

        return response()->json(['message' => 'Campaign paused', 'campaign' => $marketingCampaign->fresh()]);
    }

    public function resume(Request $request, MarketingCampaign $marketingCampaign)
    {
        if ($marketingCampaign->status !== 'paused') {
            return response()->json(['message' => 'Only paused campaigns can be resumed'], 422);
        }

        $status = ($marketingCampaign->schedule_type === 'scheduled' && $marketingCampaign->scheduled_at && $marketingCampaign->scheduled_at->isFuture())
            ? 'scheduled'
            : 'sending';

        $marketingCampaign->update(['status' => $status]);

        return response()->json(['message' => 'Campaign resumed', 'campaign' => $marketingCampaign->fresh()]);
    }

    public function cancel(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (!in_array($marketingCampaign->status, ['sending', 'scheduled', 'paused'], true)) {
            return response()->json(['message' => 'This campaign cannot be cancelled'], 422);
        }

        $marketingCampaign->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        // Remaining unsent recipients are skipped (in-flight jobs self-check too)
        MarketingCampaignRecipient::where('campaign_id', $marketingCampaign->id)
            ->whereIn('status', ['pending', 'queued', 'deferred'])
            ->update(['status' => 'skipped', 'skipped_reason' => 'cancelled', 'updated_at' => now()]);

        $marketingCampaign->recalcStatusCounters();

        return response()->json(['message' => 'Campaign cancelled', 'campaign' => $marketingCampaign->fresh()]);
    }

    public function duplicate(Request $request, MarketingCampaign $marketingCampaign)
    {
        $copy = MarketingCampaign::create([
            'user_id' => $request->user()->id,
            'name' => $marketingCampaign->name . ' (Copy)',
            'channel' => $marketingCampaign->channel,
            'status' => 'draft',
            'template_id' => $marketingCampaign->template_id,
            'subject' => $marketingCampaign->subject,
            'body_html' => $marketingCampaign->body_html,
            'preheader' => $marketingCampaign->preheader,
            'audience_config' => $marketingCampaign->audience_config,
            'schedule_type' => 'immediate',
            'smtp_account_id' => $marketingCampaign->smtp_account_id,
        ]);

        return response()->json($copy, 201);
    }

    public function testSend(Request $request, MarketingCampaign $marketingCampaign)
    {
        $validated = $request->validate([
            'to' => 'required|email',
        ]);

        $body = $marketingCampaign->body_html;
        $subject = $marketingCampaign->subject;

        if (!$body && $marketingCampaign->template_id) {
            $template = $marketingCampaign->template;
            $body = $template?->body_html;
            $subject = $subject ?: $template?->subject;
        }

        if (!$body) {
            return response()->json(['message' => 'Campaign has no content yet'], 422);
        }

        $account = MarketingMailerService::pickAccount($request->user()->company_id, $marketingCampaign->smtp_account_id);
        if (!$account) {
            return response()->json(['message' => 'No active SMTP account available. Add one in Marketing Settings.'], 422);
        }

        $rendered = MarketingTemplateRenderService::render(
            $body,
            $subject ?? '',
            MarketingTemplateRenderService::sampleMergeData($request->user()->company_id)
        );

        try {
            MarketingMailerService::applyMarketingSmtp($account);
            Mail::to($validated['to'])->send(new MarketingCampaignMail('[TEST] ' . $rendered['subject'], $rendered['html']));
            MarketingMailerService::recordSuccess($account);

            return response()->json(['message' => 'Test email sent to ' . $validated['to']]);
        } catch (\Exception $e) {
            MarketingMailerService::recordFailure($account, $e->getMessage());
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    public function recipients(Request $request, MarketingCampaign $marketingCampaign)
    {
        $query = $marketingCampaign->recipients();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('email', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $recipients = $query->orderBy('id')->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $recipients->items(),
            'total' => $recipients->total(),
            'current_page' => $recipients->currentPage(),
            'last_page' => $recipients->lastPage(),
            'per_page' => $recipients->perPage(),
        ]);
    }

    /**
     * CSV import: rows become recipient rows on the draft campaign directly.
     * Extra CSV columns are exposed as {{csv.column}} merge variables.
     */
    public function importRecipients(Request $request, MarketingCampaign $marketingCampaign)
    {
        if (!in_array($marketingCampaign->status, ['draft'], true)) {
            return response()->json(['message' => 'Recipients can only be imported into draft campaigns'], 422);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if (!$handle) {
            return response()->json(['message' => 'Could not read the uploaded file'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'The CSV file is empty'], 422);
        }

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $header);
        $emailIndex = array_search('email', $header, true);
        if ($emailIndex === false) {
            fclose($handle);
            return response()->json(['message' => 'The CSV must contain an "email" column'], 422);
        }
        $nameIndex = array_search('name', $header, true);

        $imported = 0;
        $skipped = 0;
        $batch = [];

        while (($row = fgetcsv($handle)) !== false) {
            $email = strtolower(trim((string) ($row[$emailIndex] ?? '')));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;
                continue;
            }

            $name = $nameIndex !== false ? trim((string) ($row[$nameIndex] ?? '')) : '';

            $mergeData = [
                'recipient.name' => $name,
                'recipient.first_name' => $name ? explode(' ', $name)[0] : '',
                'recipient.email' => $email,
            ];
            foreach ($header as $i => $column) {
                if ($i === $emailIndex || $column === '' || $column === 'name') {
                    continue;
                }
                $mergeData['csv.' . preg_replace('/[^a-z0-9_]/', '_', $column)] = trim((string) ($row[$i] ?? ''));
            }

            $batch[] = [
                'company_id' => $marketingCampaign->company_id,
                'campaign_id' => $marketingCampaign->id,
                'channel' => $marketingCampaign->channel,
                'source_type' => 'csv',
                'source_id' => null,
                'email' => $email,
                'name' => $name ?: null,
                'merge_data' => json_encode($mergeData),
                'token' => Str::random(40),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $imported++;

            if (count($batch) >= 500) {
                MarketingCampaignRecipient::insertOrIgnore($batch);
                $batch = [];
            }
        }
        fclose($handle);

        if (!empty($batch)) {
            MarketingCampaignRecipient::insertOrIgnore($batch);
        }

        $marketingCampaign->recalcStatusCounters();

        return response()->json([
            'message' => "Imported {$imported} recipient(s)" . ($skipped ? ", {$skipped} invalid row(s) skipped" : ''),
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    /**
     * Live audience count + sample for the campaign wizard.
     */
    public function audiencePreview(Request $request)
    {
        $validated = $request->validate([
            'sources' => 'required|array|min:1',
            'sources.*.type' => 'required|string|in:segment,customers,leads,contacts,manual,csv',
        ]);

        $companyId = $request->user()->company_id;
        $total = 0;
        $sample = [];
        $manualCount = 0;

        foreach ($validated['sources'] as $source) {
            if ($source['type'] === 'segment') {
                $segment = \App\Models\MarketingSegment::find($source['id'] ?? 0);
                if ($segment) {
                    $total += MarketingAudienceService::count($companyId, $segment->source, $segment->filters ?? []);
                    $sample = array_merge($sample, MarketingAudienceService::sample($companyId, $segment->source, $segment->filters ?? [], 5));
                }
            } elseif (in_array($source['type'], ['customers', 'leads', 'contacts'], true)) {
                $total += MarketingAudienceService::count($companyId, $source['type'], $source['filters'] ?? []);
                $sample = array_merge($sample, MarketingAudienceService::sample($companyId, $source['type'], $source['filters'] ?? [], 5));
            } elseif ($source['type'] === 'manual') {
                $manualCount += count($source['recipients'] ?? []);
            }
        }

        return response()->json([
            'count' => $total + $manualCount,
            'sample' => array_slice($sample, 0, 10),
        ]);
    }

    private function validateCampaign(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_id' => 'nullable|exists:marketing_templates,id',
            'subject' => 'nullable|string|max:255',
            'body_html' => 'nullable|string',
            'preheader' => 'nullable|string|max:255',
            'audience_config' => 'nullable|array',
            'schedule_type' => 'nullable|string|in:immediate,scheduled',
            'scheduled_at' => 'nullable|date',
            'timezone' => 'nullable|timezone',
            'smtp_account_id' => 'nullable|exists:marketing_smtp_accounts,id',
        ]);

        if (($validated['schedule_type'] ?? 'immediate') === 'scheduled' && empty($validated['scheduled_at'])) {
            abort(response()->json(['message' => 'A scheduled campaign needs a send date/time'], 422));
        }

        return $validated;
    }
}
