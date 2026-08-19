<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\CustomerLabel;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;

class CustomerLabelControllerTest extends FullSchemaTestCase
{
    private function makeLabel(Company $company, array $overrides = []): CustomerLabel
    {
        $label = new CustomerLabel(array_merge([
            'name' => 'VIP',
            'color' => '#6366F1',
        ], $overrides));
        $label->company_id = $company->id;
        $label->save();

        return $label;
    }

    private function makeCustomer(Company $company, array $overrides = []): Customer
    {
        $customer = new Customer(array_merge([
            'name' => 'Acme ' . uniqid(),
        ], $overrides));
        $customer->company_id = $company->id;
        $customer->save();

        return $customer;
    }

    public function test_index_returns_company_labels_alphabetically_with_customer_counts(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $zebra = $this->makeLabel($company, ['name' => 'ZEBRA']);
        $alpha = $this->makeLabel($company, ['name' => 'ALPHA']);
        $alpha->customers()->attach($this->makeCustomer($company)->id);

        $this->makeLabel($this->makeCompany(), ['name' => 'OTHER TENANT']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/staff/customer-labels');

        $response->assertOk();
        $this->assertSame([$alpha->id, $zebra->id], array_column($response->json(), 'id'));
        $this->assertSame(1, $response->json('0.customers_count'));
        $this->assertSame(0, $response->json('1.customers_count'));
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/staff/customer-labels')->assertUnauthorized();
    }

    public function test_store_uppercases_the_name_and_defaults_the_color(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels', ['name' => '  key account ']);

        $response->assertCreated();
        $response->assertJsonPath('name', 'KEY ACCOUNT');
        $response->assertJsonPath('color', '#6366F1');
        $response->assertJsonPath('created_by', $user->id);
        $response->assertJsonPath('customers_count', 0);
        $this->assertDatabaseHas('customer_labels', [
            'name' => 'KEY ACCOUNT',
            'company_id' => $company->id,
        ]);
    }

    public function test_store_rejects_a_duplicate_name_and_a_malformed_color(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $this->makeLabel($company, ['name' => 'VIP']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels', ['name' => 'VIP'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        // Names are stored uppercased, so a differently-cased duplicate is one
        // too.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels', ['name' => ' vip '])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels', ['name' => 'NEW', 'color' => 'red'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('color');
    }

    public function test_label_names_are_only_unique_within_a_company(): void
    {
        $this->makeLabel($this->makeCompany(), ['name' => 'VIP']);

        $company = $this->makeCompany();
        $user = $this->makeUser($company);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels', ['name' => 'VIP'])
            ->assertCreated();

        $this->assertSame(
            2,
            CustomerLabel::withoutGlobalScope('company')->where('name', 'VIP')->count()
        );
    }

    public function test_update_renames_a_label_and_allows_keeping_its_own_name(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $label = $this->makeLabel($company, ['name' => 'VIP']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/staff/customer-labels/' . $label->id, ['name' => 'vip', 'color' => '#ABCDEF'])
            ->assertOk()
            ->assertJsonPath('name', 'VIP')
            ->assertJsonPath('color', '#ABCDEF');

        $this->assertSame('#ABCDEF', $label->fresh()->color);
    }

    public function test_update_rejects_a_name_already_used_by_another_label(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $this->makeLabel($company, ['name' => 'VIP']);
        $other = $this->makeLabel($company, ['name' => 'CHURN RISK']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/staff/customer-labels/' . $other->id, ['name' => 'VIP'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_destroy_detaches_customers_before_deleting_the_label(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $label = $this->makeLabel($company);
        $customer = $this->makeCustomer($company);
        $label->customers()->attach($customer->id);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/staff/customer-labels/' . $label->id)
            ->assertOk()
            ->assertJsonPath('message', 'Label deleted');

        $this->assertDatabaseMissing('customer_labels', ['id' => $label->id]);
        $this->assertDatabaseMissing('customer_label_pivot', ['label_id' => $label->id]);
        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_a_label_from_another_company_is_not_resolvable(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $foreign = $this->makeLabel($this->makeCompany(), ['name' => 'THEIRS']);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/staff/customer-labels/' . $foreign->id)
            ->assertNotFound();

        $this->assertDatabaseHas('customer_labels', ['id' => $foreign->id]);
    }

    public function test_assign_team_assigns_every_labelled_customer_and_notifies_the_staff_member(): void
    {
        Notification::fake();

        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $staff = $this->makeUser($company, ['role' => 'salesman']);
        $label = $this->makeLabel($company);
        $first = $this->makeCustomer($company);
        $second = $this->makeCustomer($company);
        $unlabelled = $this->makeCustomer($company);
        $label->customers()->attach([$first->id, $second->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels/' . $label->id . '/assign-team', ['user_id' => $staff->id])
            ->assertOk()
            ->assertJsonPath('message', 'Team assignment complete')
            ->assertJsonPath('affected', 2);

        $this->assertDatabaseHas('customer_user', ['customer_id' => $first->id, 'user_id' => $staff->id]);
        $this->assertDatabaseHas('customer_user', ['customer_id' => $second->id, 'user_id' => $staff->id]);
        $this->assertDatabaseMissing('customer_user', ['customer_id' => $unlabelled->id, 'user_id' => $staff->id]);

        Notification::assertSentTo($staff, SystemNotification::class);
    }

    public function test_assign_team_does_not_duplicate_an_existing_assignment(): void
    {
        Notification::fake();

        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $staff = $this->makeUser($company, ['role' => 'salesman']);
        $label = $this->makeLabel($company);
        $customer = $this->makeCustomer($company);
        $label->customers()->attach($customer->id);
        $customer->assigned_users()->attach($staff->id);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels/' . $label->id . '/assign-team', ['user_id' => $staff->id])
            ->assertOk();

        $this->assertSame(1, $customer->assigned_users()->where('users.id', $staff->id)->count());
    }

    public function test_assign_team_requires_an_existing_user(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company);
        $label = $this->makeLabel($company);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/staff/customer-labels/' . $label->id . '/assign-team', ['user_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('user_id');
    }
}
