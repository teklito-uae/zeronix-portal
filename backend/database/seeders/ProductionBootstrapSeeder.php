<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * One-time bootstrap for a fresh production database: recreates the real
 * Zeronix tenant (Company) and admin (User) that already exist in the
 * local/dev database, plus the default document templates scoped to that
 * company, so a fresh production install doesn't start from an empty
 * database.
 *
 * Deliberately excludes `smtp_password`/`imap_password` — those are stored
 * as plain text (no `encrypted` cast on the User model) and must never be
 * committed to git. Re-enter them once via Settings → Email after seeding.
 *
 * Also deliberately does NOT carry over the real login password hash —
 * this repo is public on GitHub, and even a one-way bcrypt hash is a real
 * offline-cracking target once it's sitting in public git history. Instead
 * this sets a random password nobody (including whoever wrote this seeder)
 * ever knows; use "Forgot password" on the production login page right
 * after seeding to set the real one via the email-reset flow.
 *
 * Safe to re-run: everything is matched by a natural unique key
 * (email) via updateOrCreate(), so running this twice updates rather than
 * duplicates (though a re-run does reset the password to a new random
 * value each time — only run this once per environment, then just use
 * "Forgot password" if you need in again).
 */
class ProductionBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::updateOrCreate(
            ['email' => 'ismail@zeronix.ae'],
            [
                'name' => 'Zeronix',
                'phone' => null,
                'address' => null,
                'industry' => null,
                'status' => 'approved',
                'settings' => [
                    'currency' => 'AED',
                    'base_currency' => 'USD',
                    'logo_path' => '/storage/brand-logos/3pw8UJ1BDFoap0VfxOtprtCVHkxwZ5Mw8YQ9EMef.png',
                    'company_name' => 'ZERONIX TECHNOLOGY LLC',
                    'company_email' => 'ismail.zeronix@gmail.com',
                    'company_phone' => null,
                    'company_address' => 'AL-RAFFA STREET, Bur Dubai, Dubai - UAE',
                    'primary_color' => '#058f65',
                    'tax_number' => null,
                    'tax_number_label' => 'TRN',
                    'bank_details' => null,
                    'terms_conditions' => null,
                    'payment_terms' => ['Due on Receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60'],
                    'quote_prefix' => 'QT-',
                    'invoice_prefix' => 'INV-',
                    'sales_order_prefix' => 'SO-',
                    'delivery_prefix' => 'DN-',
                    'purchase_bill_prefix' => 'PB-',
                    'receipt_prefix' => 'RCP-',
                    'deal_prefix' => 'ZRNX-DL-',
                    'lead_prefix' => 'ZRNX-LD-',
                    'customer_prefix' => 'ZRNX-CUS-',
                    'supplier_prefix' => 'ZRNX-SUP-',
                ],
            ]
        );

        User::updateOrCreate(
            ['email' => 'ismail@zeronix.ae'],
            [
                'name' => 'Ismail',
                // Random, thrown away immediately after this line runs —
                // use "Forgot password" on production to set the real one.
                'password' => Hash::make(Str::random(40)),
                'role' => 'admin',
                'manager_id' => null,
                'designation' => null,
                'avatar_color' => '#8b5cf6',
                'phone' => '=971567850662',
                'company_id' => $company->id,
                'permissions' => [],
                'is_active' => true,
                'shift_start' => '09:00:00',
                'shift_end' => '18:00:00',
                'smtp_host' => 'smtp.hostinger.com',
                'smtp_port' => 465,
                'smtp_username' => 'sales@zeronix.ae',
                'smtp_encryption' => 'ssl',
                'imap_host' => 'imap.hostinger.com',
                'imap_port' => '993',
                'imap_username' => 'sales@zeronix.ae',
                'imap_encryption' => 'ssl',
                // smtp_password / imap_password intentionally omitted — set
                // these manually via Settings → Email after seeding.
            ]
        );

        // TemplateSeeder doesn't set company_id itself (it only gets
        // auto-filled by BelongsToCompany when an authenticated user creates
        // a row, which isn't the case here) — same gap we hit locally.
        // Run it, then assign any newly-created, still-unscoped rows to
        // this company.
        (new TemplateSeeder())->run();
        Template::whereNull('company_id')->update(['company_id' => $company->id]);
    }
}
