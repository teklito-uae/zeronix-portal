<?php

namespace App\Http\Controllers;

use App\Models\MarketingSetting;
use Illuminate\Http\Request;

class MarketingSettingsController extends Controller
{
    public function show(Request $request)
    {
        $settings = MarketingSetting::forCompany($request->user()->company_id);

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'timezone' => 'nullable|timezone',
            'business_days' => 'nullable|array',
            'business_days.*' => 'integer|between:1,7',
            'send_start_time' => 'nullable|date_format:H:i',
            'send_end_time' => 'nullable|date_format:H:i',
            'enforce_business_hours' => 'nullable|boolean',
            'min_interval_seconds' => 'nullable|integer|min:0|max:3600',
            'max_interval_seconds' => 'nullable|integer|min:0|max:3600',
            'rate_per_minute' => 'nullable|integer|min:1|max:600',
            'rate_per_hour' => 'nullable|integer|min:1',
            'rate_per_day' => 'nullable|integer|min:1',
            'per_domain_limits' => 'nullable|array',
            'per_domain_limits.*' => 'integer|min:1',
            'cool_off_hours' => 'nullable|integer|min:0',
            'max_emails_per_recipient_per_month' => 'nullable|integer|min:0',
            'duplicate_protection_days' => 'nullable|integer|min:0',
            'track_opens' => 'nullable|boolean',
            'track_clicks' => 'nullable|boolean',
            'append_unsubscribe_footer' => 'nullable|boolean',
            'unsubscribe_footer_html' => 'nullable|string',
            'default_test_email' => 'nullable|email',
        ]);

        if (isset($validated['min_interval_seconds'], $validated['max_interval_seconds'])
            && $validated['min_interval_seconds'] > $validated['max_interval_seconds']) {
            return response()->json(['message' => 'Minimum interval cannot exceed maximum interval'], 422);
        }

        $settings = MarketingSetting::forCompany($request->user()->company_id);
        $settings->update($validated);

        return response()->json($settings->fresh());
    }
}
