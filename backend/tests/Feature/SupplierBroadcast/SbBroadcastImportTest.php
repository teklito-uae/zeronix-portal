<?php

namespace Tests\Feature\SupplierBroadcast;

use App\Models\SbCategory;
use App\Models\SbProduct;
use App\Models\SbVendor;
use Laravel\Sanctum\Sanctum;

class SbBroadcastImportTest extends SbTestCase
{
    private const SAMPLE_TEXT = <<<'TEXT'
HP EliteBook 840 G9 i5 16/512 - AED 2,450

Dell Latitude 5440
i7
16GB
512GB
AED 2,950

Lenovo ThinkPad E14
i5
AED 2,200
TEXT;

    private function vendorAndCategory($company): array
    {
        $category = $this->makeSbCategory($company, ['name' => 'Laptops']);
        $vendor = $this->makeSbVendor($company, [
            'name' => 'Import Vendor',
            'phone_raw' => '0505555555',
            'phone_e164' => SbVendor::normalizePhone('0505555555'),
            'category_id' => $category->id,
        ]);

        return [$vendor, $category];
    }

    public function test_importing_a_broadcast_creates_products(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        [$vendor, $category] = $this->vendorAndCategory($company);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/admin/sb/broadcasts', [
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
            'raw_text' => self::SAMPLE_TEXT,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('parsed_row_count', 3);

        $broadcastId = $response->json('id');

        $this->assertSame(3, SbProduct::where('broadcast_id', $broadcastId)->count());

        $dell = SbProduct::where('broadcast_id', $broadcastId)
            ->where('product_name', 'Dell Latitude 5440')
            ->first();

        $this->assertNotNull($dell);
        $this->assertSame('16GB', $dell->spec_ram);
        $this->assertSame('512GB', $dell->spec_storage);
        $this->assertEquals(2950, (float) $dell->price);
        $this->assertSame($vendor->id, $dell->vendor_id);
        $this->assertSame($category->id, $dell->category_id);

        $hp = SbProduct::where('broadcast_id', $broadcastId)
            ->where('product_name', 'HP EliteBook 840 G9')
            ->first();
        $this->assertNotNull($hp);
        $this->assertEquals(2450, (float) $hp->price);
        $this->assertSame('16GB', $hp->spec_ram);
        $this->assertSame('512GB', $hp->spec_storage);
    }

    public function test_get_broadcast_returns_products(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        [$vendor, $category] = $this->vendorAndCategory($company);
        Sanctum::actingAs($user, ['*']);

        $createResponse = $this->postJson('/api/admin/sb/broadcasts', [
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
            'raw_text' => self::SAMPLE_TEXT,
        ]);
        $broadcastId = $createResponse->json('id');

        $response = $this->getJson("/api/admin/sb/broadcasts/{$broadcastId}");

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'products');
    }

    public function test_delete_broadcast(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        [$vendor, $category] = $this->vendorAndCategory($company);
        Sanctum::actingAs($user, ['*']);

        $createResponse = $this->postJson('/api/admin/sb/broadcasts', [
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
            'raw_text' => self::SAMPLE_TEXT,
        ]);
        $broadcastId = $createResponse->json('id');

        $response = $this->deleteJson("/api/admin/sb/broadcasts/{$broadcastId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('sb_broadcasts', ['id' => $broadcastId]);
    }
}
