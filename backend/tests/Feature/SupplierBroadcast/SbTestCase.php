<?php

namespace Tests\Feature\SupplierBroadcast;

use App\Models\Company;
use App\Models\SbBroadcast;
use App\Models\SbCategory;
use App\Models\SbProduct;
use App\Models\SbVendor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Shared base for Supplier Broadcast feature tests.
 *
 * The full migration history (129+ files accumulated by this long-running
 * app) was never exercised against SQLite and contains several unrelated,
 * pre-existing MySQL-only migrations that throw under sqlite (raw DDL,
 * SQLite ALTER TABLE column/index limitations, etc.) — see the customers
 * table migrations for examples. Fixing all of that legacy migration debt
 * is out of scope for adding Supplier Broadcast coverage, so instead of
 * running every migration via the default RefreshDatabase behavior, this
 * base class restricts migrate:fresh to exactly the migrations the
 * Supplier Broadcast module actually depends on: users, personal access
 * tokens, companies, and the six sb_* tables. This keeps the test database
 * schema a faithful (if narrower) subset of the real one, entirely via
 * --path, with zero application/model code changes.
 */
abstract class SbTestCase extends TestCase
{
    use RefreshDatabase;

    protected function migrateFreshUsing()
    {
        return array_merge([
            '--drop-views' => $this->shouldDropViews(),
            '--drop-types' => $this->shouldDropTypes(),
            '--seed' => $this->shouldSeed(),
        ], [
            '--path' => [
                'database/migrations/0001_01_01_000000_create_users_table.php',
                'database/migrations/2026_04_21_213541_create_personal_access_tokens_table.php',
                'database/migrations/2026_04_26_040843_add_roles_and_smtp_to_users_table.php',
                'database/migrations/2026_04_26_042625_add_imap_fields_to_users_table.php',
                'database/migrations/2026_06_14_000606_add_phone_to_users_table.php',
                'database/migrations/2026_06_14_005756_add_shift_times_to_users_table.php',
                'database/migrations/2026_06_16_010744_create_companies_table.php',
                'database/migrations/2026_06_16_012702_add_attachments_to_companies_table.php',
                'database/migrations/2026_06_16_021145_add_status_to_companies_table.php',
                'database/migrations/2026_06_16_024419_add_company_id_to_tenant_tables.php',
                'database/migrations/2026_07_06_090002_drop_dead_crm_fields_from_companies_table.php',
                'database/migrations/2026_07_22_173947_add_settings_to_companies_table.php',
                'database/migrations/2026_07_24_000001_add_industry_and_address_to_companies_table.php',
                'database/migrations/2026_07_26_000001_add_manager_id_to_users_table.php',
                'database/migrations/2026_07_27_000004_add_avatar_color_to_users_table.php',
                'database/migrations/2026_07_28_000001_create_sb_categories_table.php',
                'database/migrations/2026_07_28_000002_create_sb_vendors_table.php',
                'database/migrations/2026_07_28_000003_create_sb_broadcasts_table.php',
                'database/migrations/2026_07_28_000004_create_sb_extension_tokens_table.php',
                'database/migrations/2026_07_28_000005_create_sb_extension_audit_logs_table.php',
                'database/migrations/2026_07_28_000006_create_sb_products_table.php',
            ],
        ]);
    }

    protected function makeCompany(array $overrides = []): Company
    {
        return Company::create(array_merge([
            'name' => 'Test Company ' . uniqid(),
        ], $overrides));
    }

    protected function makeUser(Company $company, array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => 'user' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'company_id' => $company->id,
            'is_active' => true,
        ], $overrides));
    }

    /**
     * Directly create Sb* rows scoped to a given company for test setup.
     *
     * IMPORTANT: `company_id` is deliberately absent from every Sb* model's
     * $fillable — in the real app it is only ever auto-filled by
     * BelongsToCompany::creating() from the currently authenticated user.
     * Passing 'company_id' inside a mass-assignment array (e.g.
     * SbVendor::create(['company_id' => ...])) is silently ignored and
     * leaves the row's company_id null, which would make multi-tenant
     * scoping assertions meaningless (a null company_id never matches any
     * real company's scope, so "returns 0 rows" tests would trivially pass
     * for the wrong reason). These helpers set company_id via direct
     * property assignment, which bypasses $fillable, so test fixtures are
     * always correctly scoped regardless of the current auth() state.
     */
    protected function makeSbCategory(Company $company, array $overrides = []): SbCategory
    {
        $category = new SbCategory(array_merge([
            'name' => 'Category ' . uniqid(),
        ], $overrides));
        $category->company_id = $company->id;
        $category->save();

        return $category;
    }

    protected function makeSbVendor(Company $company, array $overrides = []): SbVendor
    {
        $phoneRaw = $overrides['phone_raw'] ?? ('05' . random_int(10000000, 99999999));

        $vendor = new SbVendor(array_merge([
            'name' => 'Vendor ' . uniqid(),
            'phone_raw' => $phoneRaw,
            'phone_e164' => SbVendor::normalizePhone($phoneRaw),
        ], $overrides));
        $vendor->company_id = $company->id;
        $vendor->save();

        return $vendor;
    }

    protected function makeSbBroadcast(Company $company, array $overrides = []): SbBroadcast
    {
        $broadcast = new SbBroadcast(array_merge([
            'raw_text' => 'placeholder',
        ], $overrides));
        $broadcast->company_id = $company->id;
        $broadcast->save();

        return $broadcast;
    }

    protected function makeSbProduct(Company $company, array $overrides = []): SbProduct
    {
        $product = new SbProduct(array_merge([
            'raw_line' => 'placeholder line',
            'product_name' => 'Test Product',
            'price' => 100,
            'parse_confidence' => 'high',
        ], $overrides));
        $product->company_id = $company->id;
        $product->save();

        return $product;
    }
}
