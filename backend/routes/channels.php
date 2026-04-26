<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ChatConversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    // Determine the guard (Admin 'auth' or Customer 'customer') based on the $user class
    if (get_class($user) === 'App\Models\User') {
        return true; // Admins can join any room
    }
    
    // Customers can only join their own room
    $conversation = ChatConversation::find($roomId);
    if ($conversation && get_class($user) === 'App\Models\Customer') {
        return (int) $user->id === (int) $conversation->customer_id;
    }
    
    return false;
}, ['guards' => ['sanctum', 'customer']]);
