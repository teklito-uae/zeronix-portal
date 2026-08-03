<?php

namespace Tests\Feature\SupplierBroadcast;

use App\Models\SbVendor;
use Laravel\Sanctum\Sanctum;

class SbVendorTest extends SbTestCase
{
    public function test_authenticated_user_can_create_a_vendor(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/admin/sb/vendors', [
            'name' => 'Acme Trading',
            'phone_raw' => '050 123 4567',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('name', 'Acme Trading');

        $this->assertDatabaseHas('sb_vendors', [
            'name' => 'Acme Trading',
            'phone_raw' => '050 123 4567',
            'phone_e164' => '+971501234567',
            'company_id' => $company->id,
        ]);
    }

    public function test_phone_normalization_end_to_end(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/admin/sb/vendors', [
            'name' => 'Phone Test Vendor',
            'phone_raw' => '050 123 4567',
        ]);

        $response->assertStatus(201);

        $vendor = SbVendor::first();
        $this->assertSame('+971501234567', $vendor->phone_e164);
    }

    public function test_duplicate_phone_within_company_is_rejected_with_422(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $this->postJson('/api/admin/sb/vendors', [
            'name' => 'First Vendor',
            'phone_raw' => '050 123 4567',
        ])->assertStatus(201);

        $response = $this->postJson('/api/admin/sb/vendors', [
            'name' => 'Second Vendor',
            'phone_raw' => '0501234567',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'A vendor with this phone number already exists');
    }

    public function test_can_list_vendors(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $this->makeSbVendor($company, [
            'name' => 'Listed Vendor',
            'phone_raw' => '0501111111',
            'phone_e164' => SbVendor::normalizePhone('0501111111'),
        ]);

        $response = $this->getJson('/api/admin/sb/vendors');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Listed Vendor');
    }

    public function test_can_update_a_vendor(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $vendor = $this->makeSbVendor($company, [
            'name' => 'Old Name',
            'phone_raw' => '0502222222',
            'phone_e164' => SbVendor::normalizePhone('0502222222'),
        ]);

        $response = $this->putJson("/api/admin/sb/vendors/{$vendor->id}", [
            'name' => 'New Name',
            'phone_raw' => '0502222222',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('name', 'New Name');

        $this->assertDatabaseHas('sb_vendors', [
            'id' => $vendor->id,
            'name' => 'New Name',
        ]);
    }

    public function test_can_delete_a_vendor(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $vendor = $this->makeSbVendor($company, [
            'name' => 'To Delete',
            'phone_raw' => '0503333333',
            'phone_e164' => SbVendor::normalizePhone('0503333333'),
        ]);

        $response = $this->deleteJson("/api/admin/sb/vendors/{$vendor->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('sb_vendors', ['id' => $vendor->id]);
    }

    public function test_company_scoping_hides_vendors_from_other_companies(): void
    {
        $companyA = $this->makeCompany();
        $companyB = $this->makeCompany();
        $userA = $this->makeUser($companyA);
        $userB = $this->makeUser($companyB);

        $this->makeSbVendor($companyA, [
            'name' => 'Company A Vendor',
            'phone_raw' => '0504444444',
            'phone_e164' => SbVendor::normalizePhone('0504444444'),
        ]);

        // Sanity check: company A's own user CAN see the vendor it owns —
        // this is what makes the "company B sees zero" assertion below a
        // meaningful scoping check rather than a coincidence.
        Sanctum::actingAs($userA, ['*']);
        $this->getJson('/api/admin/sb/vendors')->assertJsonCount(1, 'data');

        Sanctum::actingAs($userB, ['*']);

        $response = $this->getJson('/api/admin/sb/vendors');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }
}
