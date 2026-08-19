<?php

namespace Tests\Feature;

use App\Models\Tag;

class TagControllerTest extends FullSchemaTestCase
{
    public function test_index_returns_tags_newest_first(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $older = Tag::create(['company_id' => $company->id, 'name' => 'older', 'color' => '#111111']);
        $older->created_at = now()->subDay();
        $older->save();

        $newer = Tag::create(['company_id' => $company->id, 'name' => 'newer']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/staff/tags');

        $response->assertOk();
        $this->assertSame(
            [$newer->id, $older->id],
            array_column($response->json(), 'id')
        );
    }

    public function test_index_is_scoped_to_the_authenticated_users_company(): void
    {
        $company = $this->makeCompany();
        $other = $this->makeCompany();
        $user = $this->makeUser($company);

        Tag::create(['company_id' => $company->id, 'name' => 'ours']);
        Tag::create(['company_id' => $other->id, 'name' => 'theirs']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/staff/tags');

        $response->assertOk();
        $response->assertJsonCount(1);
        $this->assertSame('ours', $response->json('0.name'));
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/staff/tags')->assertUnauthorized();
    }

    public function test_store_creates_a_tag_scoped_to_the_users_company(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/staff/tags', [
            'name' => 'urgent',
            'color' => '#ff0000',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'urgent');
        $this->assertDatabaseHas('tags', [
            'name' => 'urgent',
            'color' => '#ff0000',
            'company_id' => $company->id,
        ]);
    }

    public function test_store_reuses_an_existing_tag_with_the_same_name(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $existing = Tag::create(['company_id' => $company->id, 'name' => 'urgent', 'color' => '#111111']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/staff/tags', ['name' => 'urgent']);

        $response->assertCreated();
        $response->assertJsonPath('id', $existing->id);
        $this->assertSame(1, Tag::where('name', 'urgent')->count());
    }

    public function test_store_updates_the_color_of_an_existing_tag(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $existing = Tag::create(['company_id' => $company->id, 'name' => 'urgent', 'color' => '#111111']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/tags', ['name' => 'urgent', 'color' => '#222222'])
            ->assertCreated()
            ->assertJsonPath('color', '#222222');

        $this->assertSame('#222222', $existing->fresh()->color);
    }

    public function test_store_validates_the_name(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/tags', ['color' => '#ff0000'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/tags', ['name' => str_repeat('a', 51)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }
}
