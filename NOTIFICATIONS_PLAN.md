# Real-Time Notifications Implementation Plan

Given the constraints of **Hostinger Shared Hosting**, running persistent background processes (like Laravel Reverb or WebSockets) is not feasible. To achieve "real-time" notifications, we have two primary options which will be detailed below. 

This document outlines the architecture, notification triggers, and the step-by-step implementation plan.

---

## 1. Infrastructure Strategy (Shared Hosting Compatible)

### Storage (Source of Truth)
We will use Laravel's native **Database Notifications**. This stores all notifications in a `notifications` table, allowing us to track unread/read statuses, display historical logs in a dropdown panel, and persist data permanently.

### Real-Time Delivery (The "Ping")
Since we cannot easily run a WebSocket server on shared hosting, we will choose between:
*   **Option A: Pusher (Recommended)** - An external hosted WebSocket service. It has a generous free tier (200k messages/day, 100 concurrent users) and natively integrates with Laravel Echo. This provides **true real-time** push notifications with zero server load.
*   **Option B: Frontend Polling (Fallback)** - We configure React Query (TanStack) to silently fetch the `/api/notifications/unread` endpoint every 15-30 seconds. It mimics real-time behavior but increases database hits. 

---

## 2. Notification Triggers & Audiences

We need a bidirectional notification system. Admins need to know when customers take action, and customers need to know when admins process their requests.

### A. Customer Actions (Notifies Admins)
| Action Trigger | Performed By | Notified Audience | Notification Message (Example) |
| :--- | :--- | :--- | :--- |
| **New Enquiry** | Customer | Assigned AM / All Admins | *"Ismail Tech submitted a new enquiry (ENQ-00123)"* |
| **Delivery Confirmed** | Customer | Assigned AM / All Admins | *"Ismail Tech confirmed delivery for Invoice INV-00123"* |
| **Delivery Rejected** | Customer | Assigned AM / All Admins | *"⚠️ Ismail Tech reported an issue with INV-00123: Damaged box"* |
| **Quote Accepted** | Customer | Assigned AM / All Admins | *"✅ Ismail Tech accepted Quote QT-00123"* |
| **Quote Rejected** | Customer | Assigned AM / All Admins | *"❌ Ismail Tech rejected Quote QT-00123"* |
| **Profile Update** | Customer | Super Admin | *"Ismail Tech requested a profile update. Review required."* |
| **New Registration** | Customer | Super Admin | *"New customer portal registration: Ismail Tech"* |

### B. Admin Actions (Notifies Customers)
| Action Trigger | Performed By | Notified Audience | Notification Message (Example) |
| :--- | :--- | :--- | :--- |
| **Quote Generated** | Admin | Specific Customer | *"Your request has been quoted (QT-00123). Ready for review."* |
| **Invoice Generated**| Admin | Specific Customer | *"A new invoice (INV-00123) has been generated for your account."* |
| **Delivery Shipped** | Admin | Specific Customer | *"🚚 Your order for INV-00123 has been shipped."* |
| **Profile Approved** | Admin | Specific Customer | *"Your company profile update has been approved."* |

*(Note: AM = Account Manager / Assigned Sales Rep)*

---

## 3. Data Structure

Laravel uses a polymorphic `notifications` table. The data column will store a JSON payload structured specifically for the React frontend:

```json
{
  "title": "Delivery Confirmed",
  "message": "Ismail Tech confirmed delivery for Invoice INV-00123",
  "action_url": "/admin/invoices/123",
  "type": "success", 
  "icon": "check-circle"
}
```

---

## 4. Implementation Steps (To Be Executed After Approval)

### Phase 1: Backend Database & Channels Setup
1. Run `php artisan notifications:table` and migrate.
2. Setup `.env` for `BROADCAST_DRIVER` (either `pusher` or `log`).
3. Define the authorization logic in `routes/channels.php` to ensure customers only receive their own notifications, and admins receive system notifications.

### Phase 2: Create Notification Classes
Generate specific notification classes for each trigger:
1. `EnquirySubmittedNotification`
2. `DeliveryStatusUpdatedNotification`
3. `QuoteStatusUpdatedNotification`
4. `DocumentGeneratedNotification`
*(These classes will define the `via()` method to use both `database` and `broadcast` channels).*

### Phase 3: Trigger Integration
Inject the notification triggers into the existing controllers:
*   `Customer/InvoiceController@confirmDelivery`
*   `Customer/EnquiryController@store`
*   `Admin/QuoteController@store`
*   etc.

### Phase 4: Frontend UI (React)
1. Install `pusher-js` and `laravel-echo` (if Option A is chosen).
2. Create a global `useNotifications` hook to listen for incoming broadcast events.
3. Update the Topbar Notification Bell to show the unread badge counter.
4. Implement a unified Notification Dropdown Panel displaying the history, with "Mark as Read" functionality.
5. Trigger Sonner toast popups for active screen notifications when an event arrives.

---

### Request for Approval
Please review this plan and let me know:
1. Do you prefer **Option A (Pusher - true real-time)** or **Option B (Frontend Polling - purely self-hosted)**?
2. Are there any additional notification triggers you'd like to add to the tables above?
