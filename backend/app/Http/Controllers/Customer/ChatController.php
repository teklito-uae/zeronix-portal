<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Get the active chat conversation for the authenticated customer.
     * If one doesn't exist, it will auto-create it.
     */
    public function index()
    {
        $customer = Auth::user(); // Assuming customer guard

        // Find existing conversation or create a new one
        $conversation = ChatConversation::firstOrCreate(
            ['customer_id' => $customer->id],
            [
                'subject' => 'General Inquiry',
                'status' => 'open',
                'last_message_at' => now(), // So it shows up in admin side immediately
            ]
        );

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages
        ]);
    }

    /**
     * Customer sends a message to the admin.
     */
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000'
        ]);

        $customer = Auth::user();
        
        $conversation = ChatConversation::firstOrCreate(
            ['customer_id' => $customer->id],
            ['subject' => 'General Inquiry', 'status' => 'open']
        );

        $message = $conversation->messages()->create([
            'sender_type' => 'customer',
            'sender_id' => $customer->id,
            'message' => $request->message,
            'is_read' => false
        ]);

        // Update conversation
        $conversation->update([
            'last_message' => $request->message,
            'last_message_at' => now()
        ]);

        // Broadcast to Pusher!
        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message, 201);
    }

    /**
     * Mark all admin messages in this conversation as read.
     */
    public function markAsRead()
    {
        $customer = Auth::user();
        $conversation = ChatConversation::where('customer_id', $customer->id)->first();
        
        if ($conversation) {
            $conversation->messages()
                ->where('sender_type', 'user')
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Marked as read']);
    }
}
