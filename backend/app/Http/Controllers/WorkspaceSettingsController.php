<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use Illuminate\Support\Facades\Storage;

class WorkspaceSettingsController extends Controller
{
    /**
     * Default document number prefixes, matching the historical hardcoded
     * literals each controller/model used before prefixes became tenant
     * configurable. A tenant that never touches these settings must see
     * numbers generated exactly as before.
     */
    private const DOCUMENT_PREFIX_DEFAULTS = [
        'invoice_prefix' => 'INV-',
        'quote_prefix' => 'QT-',
        'sales_order_prefix' => 'SO-',
        'delivery_prefix' => 'DN-',
        'purchase_bill_prefix' => 'PB-',
        'deal_prefix' => 'ZRNX-DL-',
        'lead_prefix' => 'ZRNX-LD-',
        'customer_prefix' => 'ZRNX-CUS-',
        'supplier_prefix' => 'ZRNX-SUP-',
        'receipt_prefix' => 'RCP-',
    ];

    public function show()
    {
        $user = auth()->user();
        if (!$user->company_id) {
            return response()->json(['settings' => null]);
        }

        $company = Company::find($user->company_id);
        $settings = (array) $company->settings;
        $settings['currency'] = $settings['currency'] ?? 'USD';
        $settings['base_currency'] = $settings['base_currency'] ?? 'USD';

        foreach (self::DOCUMENT_PREFIX_DEFAULTS as $key => $default) {
            $settings[$key] = $settings[$key] ?? $default;
        }

        return response()->json(['settings' => $settings]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();
        if (!$user->company_id) {
            return response()->json(['message' => 'User does not belong to a company.'], 403);
        }

        $company = Company::find($user->company_id);

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.invoice_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.quote_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.sales_order_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.delivery_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.purchase_bill_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.deal_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.lead_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.customer_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.supplier_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            'settings.receipt_prefix' => 'nullable|string|max:15|regex:/^[A-Za-z0-9-]+$/',
            // Brand/identity + currency fields — these previously had no rules,
            // so Laravel's validator silently stripped them from $validated on
            // every save (only the prefixes above ever survived).
            'settings.currency' => 'nullable|string|in:USD,AED',
            'settings.base_currency' => 'nullable|string|in:USD,AED',
            'settings.company_name' => 'nullable|string|max:255',
            'settings.company_email' => 'nullable|string|max:255',
            'settings.company_phone' => 'nullable|string|max:50',
            'settings.company_address' => 'nullable|string|max:1000',
            'settings.tax_number' => 'nullable|string|max:100',
            'settings.tax_number_label' => 'nullable|string|max:50',
            'settings.primary_color' => 'nullable|string|max:20',
            'settings.logo_path' => 'nullable|string|max:500',
            'settings.bank_details' => 'nullable|string|max:2000',
            'settings.terms_conditions' => 'nullable|string|max:5000',
            'settings.payment_terms' => 'nullable|array',
            'settings.payment_terms.*' => 'nullable|string|max:50',
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,svg|max:2048'
        ]);

        $settings = $validated['settings'];

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brand-logos', 'public');
            $settings['logo_path'] = '/storage/' . $path;
        }

        $company->settings = array_merge((array)$company->settings, $settings);
        $company->save();

        return response()->json(['settings' => $company->settings, 'message' => 'Workspace settings updated']);
    }
}
