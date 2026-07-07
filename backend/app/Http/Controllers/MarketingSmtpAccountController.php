<?php

namespace App\Http\Controllers;

use App\Models\MarketingSmtpAccount;
use App\Services\MarketingMailerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MarketingSmtpAccountController extends Controller
{
    public function index(Request $request)
    {
        $accounts = MarketingSmtpAccount::orderByDesc('priority')->orderBy('label')
            ->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $accounts->items(),
            'total' => $accounts->total(),
            'current_page' => $accounts->currentPage(),
            'last_page' => $accounts->lastPage(),
            'per_page' => $accounts->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAccount($request);

        $account = MarketingSmtpAccount::create($validated);

        return response()->json($account, 201);
    }

    public function show(Request $request, MarketingSmtpAccount $smtpAccount)
    {
        return response()->json($smtpAccount);
    }

    public function update(Request $request, MarketingSmtpAccount $smtpAccount)
    {
        $validated = $this->validateAccount($request, false);

        // Blank password means "keep existing"
        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        // Editing an account gives it a clean slate in the rotation
        $validated['consecutive_failures'] = 0;
        $validated['health_status'] = 'healthy';
        $validated['last_error'] = null;

        $smtpAccount->update($validated);

        return response()->json($smtpAccount->fresh());
    }

    public function destroy(Request $request, MarketingSmtpAccount $smtpAccount)
    {
        $smtpAccount->delete();

        return response()->json(['message' => 'SMTP account deleted']);
    }

    public function test(Request $request, MarketingSmtpAccount $smtpAccount)
    {
        $validated = $request->validate([
            'to' => 'nullable|email',
        ]);

        $to = $validated['to'] ?? $request->user()->email;

        try {
            MarketingMailerService::applyMarketingSmtp($smtpAccount);

            Mail::raw('This is a test email from the Zeronix Marketing module to verify the SMTP account "' . $smtpAccount->label . '".', function ($message) use ($smtpAccount, $to) {
                $message->from($smtpAccount->from_email, $smtpAccount->from_name)
                    ->to($to)
                    ->subject('Zeronix Marketing SMTP Test — ' . $smtpAccount->label);
            });

            MarketingMailerService::recordSuccess($smtpAccount);

            return response()->json(['message' => 'Test email sent successfully to ' . $to]);
        } catch (\Exception $e) {
            MarketingMailerService::recordFailure($smtpAccount, $e->getMessage());

            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    private function validateAccount(Request $request, bool $isCreate = true): array
    {
        return $request->validate([
            'label' => 'required|string|max:255',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|between:1,65535',
            'encryption' => 'required|string|in:tls,ssl,none',
            'username' => 'required|string|max:255',
            'password' => ($isCreate ? 'required' : 'nullable') . '|string',
            'from_email' => 'required|email|max:255',
            'from_name' => 'required|string|max:255',
            'reply_to' => 'nullable|email|max:255',
            'per_minute_limit' => 'nullable|integer|min:1',
            'hourly_limit' => 'nullable|integer|min:1',
            'daily_limit' => 'nullable|integer|min:1',
            'priority' => 'nullable|integer|between:-100,100',
            'is_active' => 'nullable|boolean',
        ]);
    }
}
