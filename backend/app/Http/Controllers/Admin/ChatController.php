<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Get all chat conversations for the admin panel.
     */
    public function index()
    {
        $conversations = ChatConversation::with('customer:id,name,company')
            ->withCount(['messages as unread_count' => function ($query) {
                $query->where('sender_type', 'customer')->where('is_read', false);
            }])
            ->orderBy('last_message_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Get paginated messages for a specific conversation.
     */
    public function show($id)
    {
        $conversation = ChatConversation::with('customer:id,name,company')->findOrFail($id);

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages
        ]);
    }

    /**
     * Admin sends a message to the customer.
     */
    public function store(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string|max:2000'
        ]);

        $conversation = ChatConversation::findOrFail($id);

        $message = $conversation->messages()->create([
            'sender_type' => 'user',
            'sender_id' => Auth::id() ?? 1, // Fallback to 1 if testing without auth
            'message' => $request->message,
            'is_read' => false
        ]);

        // Update conversation's last message timestamp
        $conversation->update([
            'last_message' => $request->message,
            'last_message_at' => now()
        ]);

        // Broadcast to Pusher!
        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message, 201);
    }

    /**
     * Mark all customer messages in this conversation as read.
     */
    public function markAsRead($id)
    {
        $conversation = ChatConversation::findOrFail($id);
        
        $conversation->messages()
            ->where('sender_type', 'customer')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read']);
    }
}
