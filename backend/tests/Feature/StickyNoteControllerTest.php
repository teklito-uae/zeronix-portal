<?php

namespace Tests\Feature;

use App\Models\StickyNote;
use App\Models\User;

class StickyNoteControllerTest extends FullSchemaTestCase
{
    private function makeNote(User $user, array $overrides = []): StickyNote
    {
        $note = new StickyNote(array_merge([
            'user_id' => $user->id,
            'content' => 'Remember this',
            'color' => '#fef08a',
            'position_index' => 0,
        ], $overrides));
        $note->company_id = $user->company_id;
        $note->save();

        return $note;
    }

    public function test_index_returns_only_the_authenticated_users_notes_ordered_by_position(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $colleague = $this->makeUser($company);

        $second = $this->makeNote($user, ['content' => 'second', 'position_index' => 2]);
        $first = $this->makeNote($user, ['content' => 'first', 'position_index' => 1]);
        $this->makeNote($colleague, ['content' => 'not mine', 'position_index' => 0]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/staff/sticky-notes');

        $response->assertOk();
        $this->assertSame([$first->id, $second->id], array_column($response->json(), 'id'));
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/staff/sticky-notes')->assertUnauthorized();
    }

    public function test_store_creates_a_note_owned_by_the_authenticated_user(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/staff/sticky-notes', [
            'content' => 'Call the supplier',
            'color' => '#fca5a5',
            'position_index' => 3,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('content', 'Call the supplier');
        $this->assertDatabaseHas('sticky_notes', [
            'user_id' => $user->id,
            'company_id' => $company->id,
            'content' => 'Call the supplier',
            'position_index' => 3,
        ]);
    }

    public function test_store_rejects_a_non_integer_position(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/sticky-notes', ['content' => 'x', 'position_index' => 'first'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('position_index');
    }

    public function test_update_changes_the_owners_own_note(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $note = $this->makeNote($user);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/staff/sticky-notes/' . $note->id, ['content' => 'Updated', 'position_index' => 5])
            ->assertOk()
            ->assertJsonPath('content', 'Updated');

        $note->refresh();
        $this->assertSame('Updated', $note->content);
        $this->assertSame(5, $note->position_index);
    }

    public function test_update_is_forbidden_for_another_users_note(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $note = $this->makeNote($this->makeUser($company), ['content' => 'theirs']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/staff/sticky-notes/' . $note->id, ['content' => 'hijacked'])
            ->assertForbidden();

        $this->assertSame('theirs', $note->fresh()->content);
    }

    public function test_destroy_deletes_the_owners_own_note(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $note = $this->makeNote($user);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/staff/sticky-notes/' . $note->id)
            ->assertOk()
            ->assertJsonPath('message', 'Deleted');

        $this->assertDatabaseMissing('sticky_notes', ['id' => $note->id]);
    }

    public function test_destroy_is_forbidden_for_another_users_note(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $note = $this->makeNote($this->makeUser($company));

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/staff/sticky-notes/' . $note->id)
            ->assertForbidden();

        $this->assertDatabaseHas('sticky_notes', ['id' => $note->id]);
    }

    public function test_a_note_from_another_company_is_not_resolvable(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $otherCompanyNote = $this->makeNote($this->makeUser($this->makeCompany()));

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/staff/sticky-notes/' . $otherCompanyNote->id)
            ->assertNotFound();

        $this->assertDatabaseHas('sticky_notes', ['id' => $otherCompanyNote->id]);
    }
}
