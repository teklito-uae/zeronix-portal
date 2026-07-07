<?php

namespace App\Http\Controllers;

use App\Mail\MarketingCampaignMail;
use App\Models\MarketingTemplate;
use App\Models\MarketingTemplateVersion;
use App\Services\MarketingMailerService;
use App\Services\MarketingTemplateRenderService;
use App\Services\MarketingTemplateSeederService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class MarketingTemplateController extends Controller
{
    public function index(Request $request)
    {
        // Lazily seed the built-in templates for this company
        if ($request->user()->company_id) {
            MarketingTemplateSeederService::seedForCompany($request->user()->company_id);
        }

        $query = MarketingTemplate::with('user:id,name');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('subject', 'like', "%{$s}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $templates = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $templates->items(),
            'total' => $templates->total(),
            'current_page' => $templates->currentPage(),
            'last_page' => $templates->lastPage(),
            'per_page' => $templates->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'preheader' => 'nullable|string|max:255',
            'body_html' => 'required|string',
            'category' => 'nullable|string|in:welcome,introduction,follow_up,renewal,promotional,custom',
        ]);

        $template = MarketingTemplate::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'category' => $validated['category'] ?? 'custom',
        ]));

        return response()->json($template, 201);
    }

    public function show(Request $request, MarketingTemplate $marketingTemplate)
    {
        return response()->json($marketingTemplate->load('user:id,name'));
    }

    public function update(Request $request, MarketingTemplate $marketingTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'preheader' => 'nullable|string|max:255',
            'body_html' => 'required|string',
            'category' => 'nullable|string|in:welcome,introduction,follow_up,renewal,promotional,custom',
            'is_active' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            // Archive the current content before overwriting
            if ($marketingTemplate->subject !== $validated['subject'] || $marketingTemplate->body_html !== $validated['body_html']) {
                MarketingTemplateVersion::create([
                    'company_id' => $marketingTemplate->company_id,
                    'template_id' => $marketingTemplate->id,
                    'version' => $marketingTemplate->current_version,
                    'subject' => $marketingTemplate->subject,
                    'body_html' => $marketingTemplate->body_html,
                    'edited_by' => $request->user()->id,
                    'created_at' => now(),
                ]);
                $validated['current_version'] = $marketingTemplate->current_version + 1;
            }

            $marketingTemplate->update($validated);

            DB::commit();
            return response()->json($marketingTemplate->fresh());
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update template', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, MarketingTemplate $marketingTemplate)
    {
        $marketingTemplate->delete();

        return response()->json(['message' => 'Template deleted']);
    }

    public function duplicate(Request $request, MarketingTemplate $marketingTemplate)
    {
        $copy = MarketingTemplate::create([
            'user_id' => $request->user()->id,
            'name' => $marketingTemplate->name . ' (Copy)',
            'subject' => $marketingTemplate->subject,
            'preheader' => $marketingTemplate->preheader,
            'body_html' => $marketingTemplate->body_html,
            'category' => $marketingTemplate->category,
            'channel' => $marketingTemplate->channel,
            'is_builtin' => false,
            'is_active' => true,
            'current_version' => 1,
        ]);

        return response()->json($copy, 201);
    }

    public function versions(Request $request, MarketingTemplate $marketingTemplate)
    {
        $versions = $marketingTemplate->versions()
            ->with('editor:id,name')
            ->orderByDesc('version')
            ->get();

        return response()->json(['data' => $versions]);
    }

    public function restoreVersion(Request $request, MarketingTemplate $marketingTemplate, int $version)
    {
        $target = $marketingTemplate->versions()->where('version', $version)->firstOrFail();

        DB::beginTransaction();
        try {
            MarketingTemplateVersion::create([
                'company_id' => $marketingTemplate->company_id,
                'template_id' => $marketingTemplate->id,
                'version' => $marketingTemplate->current_version,
                'subject' => $marketingTemplate->subject,
                'body_html' => $marketingTemplate->body_html,
                'edited_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            $marketingTemplate->update([
                'subject' => $target->subject,
                'body_html' => $target->body_html,
                'current_version' => $marketingTemplate->current_version + 1,
            ]);

            DB::commit();
            return response()->json($marketingTemplate->fresh());
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to restore version', 'error' => $e->getMessage()], 500);
        }
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'nullable|string',
            'body_html' => 'required|string',
        ]);

        $rendered = MarketingTemplateRenderService::render(
            $validated['body_html'],
            $validated['subject'] ?? '',
            MarketingTemplateRenderService::sampleMergeData($request->user()->company_id)
        );

        return response()->json($rendered);
    }

    public function testSend(Request $request, MarketingTemplate $marketingTemplate)
    {
        $validated = $request->validate([
            'to' => 'required|email',
        ]);

        $account = MarketingMailerService::pickAccount($request->user()->company_id);
        if (!$account) {
            return response()->json(['message' => 'No active SMTP account available. Add one in Marketing Settings.'], 422);
        }

        $rendered = MarketingTemplateRenderService::render(
            $marketingTemplate->body_html,
            $marketingTemplate->subject,
            MarketingTemplateRenderService::sampleMergeData($request->user()->company_id)
        );

        try {
            MarketingMailerService::applyMarketingSmtp($account);

            Mail::to($validated['to'])->send(new MarketingCampaignMail(
                '[TEST] ' . $rendered['subject'],
                $rendered['html']
            ));

            MarketingMailerService::recordSuccess($account);

            return response()->json(['message' => 'Test email sent to ' . $validated['to']]);
        } catch (\Exception $e) {
            MarketingMailerService::recordFailure($account, $e->getMessage());
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    public function variables()
    {
        return response()->json(['data' => MarketingTemplateRenderService::variables()]);
    }
}
