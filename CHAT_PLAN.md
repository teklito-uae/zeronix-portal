# Zeronix Real-Time Chat (Pusher Implementation Plan)

## 0. Environment Configuration

Since you've created your Pusher app, the first step is to configure your environment files.

**Add this to your Laravel `.env` file (Backend):**
```env
BROADCAST_CONNECTION=pusher

PUSHER_APP_ID="2146763"
PUSHER_APP_KEY="7935b3acb687b8f722ad"
PUSHER_APP_SECRET="066b9eefa104e1b58a4a"
PUSHER_APP_CLUSTER="ap2"
```

**Add this to your React `.env` file (Frontend):**
```env
VITE_PUSHER_APP_KEY="7935b3acb687b8f722ad"
VITE_PUSHER_APP_CLUSTER="ap2"
```

---

## 1. Database Architecture

---

## 1. Database Architecture

We will need two new tables to manage the chat system.

### Table: `chat_rooms`
A room represents a 1-on-1 conversation between the Zeronix Admin team and a specific Customer.
- `id` (PK)
- `customer_id` (FK to customers table)
- `last_message` (text, nullable) — caching the latest message for the sidebar
- `last_message_at` (timestamp, nullable) — for sorting rooms by most recent activity
- `created_at`, `updated_at`

### Table: `chat_messages`
Stores the actual chat messages.
- `id` (PK)
- `chat_room_id` (FK to chat_rooms table)
- `sender_type` (string) — either `'user'` (admin) or `'customer'`
- `sender_id` (unsignedBigInteger) — ID of the user or customer who sent it
- `message` (text)
- `is_read` (boolean, default: false)
- `created_at`, `updated_at`

---

## 2. Backend Implementation (Laravel)

### Packages to Install
```bash
composer require pusher/pusher-php-server
```

### Models
- `ChatRoom`: `belongsTo(Customer)`, `hasMany(ChatMessage)`
- `ChatMessage`: `belongsTo(ChatRoom)`

### Events
- `MessageSent`: Implements `ShouldBroadcast`. Broadcasts on a private channel: `private-chat.{room_id}`.

### API Routes

**Admin API (`routes/api.php` under `auth:sanctum` middleware):**
- `GET /admin/chat/rooms` — Returns all chat rooms, ordered by `last_message_at DESC`, including unread count.
- `GET /admin/chat/rooms/{id}/messages` — Returns paginated history of messages for a room.
- `POST /admin/chat/rooms/{id}/messages` — Admin sends a message to a customer.
- `POST /admin/chat/rooms/{id}/read` — Marks all messages from the customer in this room as read.

**Customer Portal API (`routes/api.php` under `customer:sanctum` middleware):**
- `GET /portal/chat/room` — Returns the customer's chat room (auto-creates one if they don't have one yet).
- `GET /portal/chat/room/messages` — Returns their message history.
- `POST /portal/chat/room/messages` — Customer sends a message to admins.
- `POST /portal/chat/room/read` — Marks all admin messages in this room as read.

---

## 3. Frontend Implementation (React)

### Packages to Install
```bash
npm install pusher-js laravel-echo
```

### Setup Echo (`src/lib/echo.ts`)
Configure Laravel Echo to connect to your Pusher cluster using your credentials.

### State Management (`React Query`)
1. **Initial Load:** Fetch `rooms` and `messages` normally using `useQuery`.
2. **Sending:** Use `useMutation` to hit the API. Update the UI *optimistically* immediately, then let the server confirm.
3. **Listening (Pusher):**
   When the chat component mounts, listen to the channel:
   ```javascript
   window.Echo.private(`chat.${roomId}`)
     .listen('MessageSent', (e) => {
         // Append the new message to React Query's cache if the sender is not the current user
         queryClient.setQueryData(['messages', roomId], oldData => [...oldData, e.message]);
     });
   ```

---

## 4. Execution Steps

When you're ready to start coding, we will execute in this order:

**Step 1:** Create Migrations, Models, and basic relationships.
**Step 2:** Build the Laravel API controllers and routes (Admin + Customer).
**Step 3:** Hook up the React frontend using standard API calls (no Pusher yet).
**Step 4:** Integrate Pusher (Broadcasting, Events, Laravel Echo) to make it real-time.
