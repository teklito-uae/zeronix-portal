<?php

namespace Tests\Feature\SupplierBroadcast;

use App\Models\SbCategory;
use App\Models\SbProduct;
use App\Models\SbVendor;
use Laravel\Sanctum\Sanctum;

class SbProductSearchTest extends SbTestCase
{
    private function makeProduct($company, SbVendor $vendor, SbCategory $category, array $overrides = []): SbProduct
    {
        $broadcast = $this->makeSbBroadcast($company, [
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
        ]);

        return $this->makeSbProduct($company, array_merge([
            'broadcast_id' => $broadcast->id,
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
        ], $overrides));
    }

    public function test_index_filters_by_vendor_id(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendorA = $this->makeSbVendor($company, ['name' => 'Vendor A']);
        $vendorB = $this->makeSbVendor($company, ['name' => 'Vendor B']);

        $this->makeProduct($company, $vendorA, $category, ['product_name' => 'From Vendor A']);
        $this->makeProduct($company, $vendorB, $category, ['product_name' => 'From Vendor B']);

        Sanctum::actingAs($user, ['*']);
        $response = $this->getJson("/api/admin/sb/products?vendor_id={$vendorA->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.product_name', 'From Vendor A');
    }

    public function test_index_filters_by_category_id(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $categoryA = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $categoryB = $this->makeSbCategory($company, ['name' => 'Phones']);
        $vendor = $this->makeSbVendor($company);

        $this->makeProduct($company, $vendor, $categoryA, ['product_name' => 'A Laptop']);
        $this->makeProduct($company, $vendor, $categoryB, ['product_name' => 'A Phone']);

        Sanctum::actingAs($user, ['*']);
        $response = $this->getJson("/api/admin/sb/products?category_id={$categoryB->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.product_name', 'A Phone');
    }

    public function test_search_endpoint_filters_by_vendor_and_category_without_query(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendor = $this->makeSbVendor($company, ['name' => 'Vendor']);
        $otherVendor = $this->makeSbVendor($company, ['name' => 'Other Vendor']);

        $this->makeProduct($company, $vendor, $category, ['product_name' => 'Matched']);
        $this->makeProduct($company, $otherVendor, $category, ['product_name' => 'Not Matched']);

        Sanctum::actingAs($user, ['*']);
        // No "q" param — must not touch the MySQL-only whereFullText() path,
        // exercised here so the search endpoint's non-fulltext filters are
        // always testable regardless of DB driver.
        $response = $this->getJson("/api/admin/sb/products/search?vendor_id={$vendor->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.product_name', 'Matched');
    }

    public function test_search_with_text_query_requires_mysql_fulltext(): void
    {
        if (config('database.default') !== 'mysql') {
            $this->markTestSkipped('Fulltext text search (whereFullText) is a MySQL-only feature; not testable under sqlite.');
        }

        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendor = $this->makeSbVendor($company, ['name' => 'Vendor']);

        $this->makeProduct($company, $vendor, $category, ['product_name' => 'Dell Latitude 5440']);

        Sanctum::actingAs($user, ['*']);
        $response = $this->getJson('/api/admin/sb/products/search?q=Dell');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_can_update_a_product(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendor = $this->makeSbVendor($company, ['name' => 'Vendor']);
        $product = $this->makeProduct($company, $vendor, $category, ['price' => 100]);

        Sanctum::actingAs($user, ['*']);
        $response = $this->putJson("/api/admin/sb/products/{$product->id}", [
            'product_name' => 'Updated Name',
            'price' => 199.99,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('product_name', 'Updated Name');

        $this->assertDatabaseHas('sb_products', [
            'id' => $product->id,
            'product_name' => 'Updated Name',
        ]);
        $this->assertEquals(199.99, (float) $product->fresh()->price);
    }

    public function test_can_delete_a_product(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendor = $this->makeSbVendor($company, ['name' => 'Vendor']);
        $product = $this->makeProduct($company, $vendor, $category);

        Sanctum::actingAs($user, ['*']);
        $response = $this->deleteJson("/api/admin/sb/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('sb_products', ['id' => $product->id]);
    }
}
