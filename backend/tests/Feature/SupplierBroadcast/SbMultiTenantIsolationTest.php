<?php

namespace Tests\Feature\SupplierBroadcast;

use Laravel\Sanctum\Sanctum;

/**
 * Cross-cutting check: company A creates a vendor, category, broadcast and
 * (via that broadcast import) products, then company B's authenticated user
 * hits every index endpoint in the module and must see zero results.
 */
class SbMultiTenantIsolationTest extends SbTestCase
{
    private const SAMPLE_TEXT = <<<'TEXT'
HP EliteBook 840 G9 i5 16/512 - AED 2,450

Dell Latitude 5440
i7
16GB
512GB
AED 2,950
TEXT;

    public function test_company_b_sees_nothing_created_by_company_a(): void
    {
        $companyA = $this->makeCompany();
        $companyB = $this->makeCompany();
        $userA = $this->makeUser($companyA);
        $userB = $this->makeUser($companyB);

        Sanctum::actingAs($userA, ['*']);

        $category = $this->postJson('/api/admin/sb/categories', ['name' => 'Laptops'])
            ->assertStatus(201)
            ->json();

        $vendor = $this->postJson('/api/admin/sb/vendors', [
            'name' => 'Company A Vendor',
            'phone_raw' => '0501231234',
            'category_id' => $category['id'],
        ])->assertStatus(201)->json();

        $broadcast = $this->postJson('/api/admin/sb/broadcasts', [
            'vendor_id' => $vendor['id'],
            'category_id' => $category['id'],
            'raw_text' => self::SAMPLE_TEXT,
        ])->assertStatus(201)->json();

        $this->assertSame(2, $broadcast['parsed_row_count']);

        // Sanity check: company A's own user sees everything it created.
        $this->getJson('/api/admin/sb/categories')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/sb/vendors')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/sb/broadcasts')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/sb/products')->assertJsonCount(2, 'data');

        Sanctum::actingAs($userB, ['*']);

        $this->getJson('/api/admin/sb/categories')->assertStatus(200)->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/sb/vendors')->assertStatus(200)->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/sb/broadcasts')->assertStatus(200)->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/sb/products')->assertStatus(200)->assertJsonCount(0, 'data');

        // Route-model-bound show/update/delete must also 404 across tenants
        // (the BelongsToCompany global scope excludes company A's rows from
        // company B's implicit binding query).
        $this->getJson("/api/admin/sb/vendors/{$vendor['id']}")->assertStatus(404);
        $this->deleteJson("/api/admin/sb/broadcasts/{$broadcast['id']}")->assertStatus(404);
    }
}
