<?php

namespace Tests\Feature\SupplierBroadcast;

use App\Models\SbCategory;
use Laravel\Sanctum\Sanctum;

class SbCategoryTest extends SbTestCase
{
    public function test_authenticated_user_can_create_a_category(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/admin/sb/categories', [
            'name' => 'Laptops',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('name', 'Laptops');

        $this->assertDatabaseHas('sb_categories', [
            'name' => 'Laptops',
            'company_id' => $company->id,
        ]);
    }

    public function test_can_update_a_category(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $category = $this->makeSbCategory($company, ['name' => 'Old Category']);

        $response = $this->putJson("/api/admin/sb/categories/{$category->id}", [
            'name' => 'New Category',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('name', 'New Category');

        $this->assertDatabaseHas('sb_categories', [
            'id' => $category->id,
            'name' => 'New Category',
        ]);
    }

    public function test_can_delete_a_category(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $category = $this->makeSbCategory($company, ['name' => 'To Delete']);

        $response = $this->deleteJson("/api/admin/sb/categories/{$category->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('sb_categories', ['id' => $category->id]);
    }

    public function test_duplicate_name_within_company_is_rejected_with_422(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        Sanctum::actingAs($user, ['*']);

        $this->postJson('/api/admin/sb/categories', ['name' => 'Phones'])->assertStatus(201);

        $response = $this->postJson('/api/admin/sb/categories', ['name' => 'Phones']);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'A category with this name already exists');
    }

    public function test_same_category_name_allowed_across_different_companies(): void
    {
        $companyA = $this->makeCompany();
        $companyB = $this->makeCompany();
        $userA = $this->makeUser($companyA);
        $userB = $this->makeUser($companyB);

        Sanctum::actingAs($userA, ['*']);
        $this->postJson('/api/admin/sb/categories', ['name' => 'Tablets'])->assertStatus(201);

        Sanctum::actingAs($userB, ['*']);
        $response = $this->postJson('/api/admin/sb/categories', ['name' => 'Tablets']);

        $response->assertStatus(201);
    }

    public function test_company_scoping_hides_categories_from_other_companies(): void
    {
        $companyA = $this->makeCompany();
        $companyB = $this->makeCompany();
        $userA = $this->makeUser($companyA);
        $userB = $this->makeUser($companyB);

        $this->makeSbCategory($companyA, ['name' => 'Company A Category']);

        // Sanity check: company A's own user CAN see it — proves the "zero
        // results" assertion below is a real scoping check, not a fixture bug.
        Sanctum::actingAs($userA, ['*']);
        $this->getJson('/api/admin/sb/categories')->assertJsonCount(1, 'data');

        Sanctum::actingAs($userB, ['*']);

        $response = $this->getJson('/api/admin/sb/categories');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }
}
