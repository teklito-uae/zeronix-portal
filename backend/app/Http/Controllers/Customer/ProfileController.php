<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Notifications\AdminNotification;
use Illuminate\Support\Facades\Notification;

class ProfileController extends Controller
{
    public function requestUpdate(Request $request)
    {
        $customer = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'trn' => 'nullable|string|max:20',
        ]);

        // Instead of updating, we send a notification to admins
        $admins = User::all(); // Or filter by role if needed
        
        $notificationData = [
            'title' => 'Profile Update Request',
            'message' => "Customer {$customer->name} ({$customer->company}) has requested to update their profile details.",
            'type' => 'warning',
            'action_url' => "/admin/customers/{$customer->id}",
            'old_data' => [
                'name' => $customer->name,
                'company' => $customer->company,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'trn' => $customer->trn,
            ],
            'new_data' => $validated,
            'customer_id' => $customer->id
        ];

        Notification::send($admins, new AdminNotification($notificationData));

        return response()->json([
            'message' => 'Your update request has been sent to the administrator for approval.'
        ]);
    }
}
