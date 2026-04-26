# Current Active Tasks

## 1. CRM Lead Generation Flow (Enquiries)
- [x] Update `Enquiries.tsx` "Add Enquiry" dialog to include a "New Customer / Lead" toggle.
- [x] If toggled to new customer, capture `name`, `email`, `phone`, `company`.
- [x] Update `EnquiryController@store` to automatically create a new `Customer` record if these lead details are provided instead of a `customer_id`.
- [x] Return the new customer data seamlessly so the UI updates.

## 2. Admin User Management & Permissions
- [x] Create `Permission` and `UserPermission` (or update `users` table) schema for designations and module access.
- [x] Build `UserController` for Super Admins to CRUD Salesmen.
- [x] Create `Users.tsx` admin page with a form to select accessible modules (e.g., Products, Quotes, Enquiries).
- [x] Update frontend Auth state to store user permissions.
- [x] Modify `Sidebar.tsx` to conditionally render navigation links based on current user permissions.
- [x] **Data Scoping/Isolation**: Update backend controllers (`CustomerController`, `EnquiryController`, `QuoteController`, `InvoiceController`) so `salesman` roles only retrieve/modify records assigned to them, while `admin` sees everything.

## 3. Global Activity Log
- [x] Create `ActivityLog` migration and model (`user_id`, `action`, `subject_type`, `subject_id`, `description`).
- [x] Add backend logging triggers when users create/send quotes, update status, etc.
- [x] Create `Activities.tsx` page for Admin view to monitor all interactions and filter by User/Date.

## 4. Per-User SMTP & IMAP Configuration
- [x] Add SMTP & IMAP fields (host, port, username, password, encryption) to the `users` table.
- [x] Create a `Settings.tsx` page where salesmen can securely input their SMTP/IMAP credentials.
- [x] Build a backend service (`MailConfigService`) that dynamically swaps Laravel's Mail config based on the authenticated user's settings.
- [x] Implement "Test Email" feature to verify SMTP settings at runtime.
- [x] Integrate `webklex/laravel-imap` to sync incoming customer replies.

## 5. Quote & Invoice Engine (API Migration)
- [x] Build `QuoteController` (CRUD, status updates, duplicate).
- [x] Update `QuoteDetail.tsx` to fetch real products and calculate margins (Fixed TS errors).
- [x] Build `InvoiceController`.
- [x] Implement DomPDF generation for both endpoints (handled via `DocumentController`).
- [x] Ensure `salesman` users only see their own generated quotes/invoices.
- [x] Fixed all TypeScript and build errors in detail pages and settings.
- [x] Integrated Hostinger default email configurations.
