<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Company;

/**
 * Covers BrandController and CategoryController — the two catalog taxonomy
 * endpoints, which share the same shape (tenant-scoped index + admin-only
 * store).
 */
class CatalogTaxonomyControllerTest extends FullSchemaTestCase
{
    private function makeBrand(Company $company, string $name): Brand
    {
        $brand = new Brand(['name' => $name]);
        $brand->company_id = $company->id;
        $brand->save();

        return $brand;
    }

    private function makeCategory(Company $company, array $attributes): Category
    {
        $category = new Category($attributes);
        $category->company_id = $company->id;
        $category->save();

        return $category;
    }

    public function test_brand_index_returns_the_companys_brands_newest_first(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $older = $this->makeBrand($company, 'Older');
        $older->created_at = now()->subDay();
        $older->save();
        $newer = $this->makeBrand($company, 'Newer');
        $this->makeBrand($this->makeCompany(), 'Other Tenant');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/brands');

        $response->assertOk();
        $this->assertSame([$newer->id, $older->id], array_column($response->json('data'), 'id'));
    }

    public function test_brand_store_creates_a_brand_for_an_admin(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/brands', ['name' => 'Zeronix', 'logo' => 'zeronix.png'])
            ->assertOk()
            ->assertJsonPath('name', 'Zeronix');

        $this->assertDatabaseHas('brands', [
            'name' => 'Zeronix',
            'logo' => 'zeronix.png',
            'company_id' => $company->id,
        ]);
    }

    public function test_brand_store_ignores_an_unknown_website_field(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/brands', ['name' => 'Zeronix', 'website' => 'https://example.test'])
            ->assertOk();

        $this->assertDatabaseHas('brands', ['name' => 'Zeronix']);
    }

    public function test_brand_store_rejects_a_duplicate_name_within_the_same_company(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);
        $this->makeBrand($company, 'Zeronix');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/brands', ['name' => 'Zeronix'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_brand_names_are_only_unique_within_a_company(): void
    {
        $this->makeBrand($this->makeCompany(), 'Zeronix');

        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/brands', ['name' => 'Zeronix'])
            ->assertOk();

        $this->assertSame(2, Brand::withoutGlobalScope('company')->where('name', 'Zeronix')->count());
    }

    public function test_brand_store_is_forbidden_for_non_admin_roles(): void
    {
        $company = $this->makeCompany();
        $salesman = $this->makeUser($company, ['role' => 'salesman']);

        $this->actingAs($salesman, 'sanctum')
            ->postJson('/api/admin/brands', ['name' => 'Zeronix'])
            ->assertForbidden();

        $this->assertDatabaseMissing('brands', ['name' => 'Zeronix']);
    }

    public function test_category_index_is_scoped_to_the_users_company(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $ours = $this->makeCategory($company, ['name' => 'Switchgear']);
        $this->makeCategory($this->makeCompany(), ['name' => 'Theirs']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/categories');

        $response->assertOk();
        $this->assertSame([$ours->id], array_column($response->json('data'), 'id'));
    }

    public function test_category_store_accepts_a_parent_from_the_same_company(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);
        $parent = $this->makeCategory($company, ['name' => 'Switchgear']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/categories', ['name' => 'Breakers', 'parent_id' => $parent->id]);

        $response->assertOk();
        $response->assertJsonPath('parent_id', $parent->id);
        $this->assertDatabaseHas('categories', [
            'name' => 'Breakers',
            'parent_id' => $parent->id,
            'company_id' => $company->id,
        ]);
    }

    public function test_category_store_rejects_a_missing_name_and_an_unknown_parent(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/categories', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/categories', ['name' => 'Breakers', 'parent_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('parent_id');
    }

    public function test_category_store_is_forbidden_for_non_admin_roles(): void
    {
        $company = $this->makeCompany();
        $salesman = $this->makeUser($company, ['role' => 'salesman']);

        $this->actingAs($salesman, 'sanctum')
            ->postJson('/api/admin/categories', ['name' => 'Breakers'])
            ->assertForbidden();

        $this->assertDatabaseMissing('categories', ['name' => 'Breakers']);
    }
}
