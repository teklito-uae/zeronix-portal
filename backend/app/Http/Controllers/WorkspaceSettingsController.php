<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use Illuminate\Support\Facades\Storage;

class WorkspaceSettingsController extends Controller
{
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
