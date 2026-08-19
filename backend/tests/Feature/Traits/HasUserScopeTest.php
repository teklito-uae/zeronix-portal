<?php

namespace Tests\Feature\Traits;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;
use Tests\Feature\FullSchemaTestCase;

class HasUserScopeTest extends FullSchemaTestCase
{
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = $this->makeCompany();
    }

    private function makeLead(User $owner, array $overrides = []): Lead
    {
        $lead = new Lead(array_merge([
            'name' => 'Lead ' . uniqid(),
            'user_id' => $owner->id,
        ], $overrides));
        $lead->company_id = $this->company->id;
        $lead->save();

        return $lead;
    }

    private function makeCustomer(array $assignedUserIds = []): Customer
    {
        $customer = new Customer(['name' => 'Customer ' . uniqid()]);
        $customer->company_id = $this->company->id;
        $customer->save();

        if ($assignedUserIds) {
            $customer->assigned_users()->attach($assignedUserIds);
        }

        return $customer;
    }

    private function makeDeal(?User $owner = null, array $assignedUserIds = []): Deal
    {
        $deal = new Deal(['title' => 'Deal ' . uniqid()]);
        $deal->company_id = $this->company->id;
        if ($owner) {
            $deal->user_id = $owner->id;
        }
        $deal->save();

        if ($assignedUserIds) {
            $deal->assigned_users()->attach($assignedUserIds);
        }

        return $deal;
    }

    public function test_admin_and_super_admin_see_every_record(): void
    {
        $admin = $this->makeUser($this->company, ['role' => 'admin']);
        $superAdmin = $this->makeUser($this->company, ['role' => 'super_admin']);
        $salesman = $this->makeUser($this->company, ['role' => 'salesman']);

        $this->makeLead($admin);
        $this->makeLead($salesman);

        $this->assertSame(2, Lead::forUser($admin)->count());
        $this->assertSame(2, Lead::forUser($superAdmin)->count());
    }

    public function test_a_salesman_only_sees_records_they_own(): void
    {
        $salesman = $this->makeUser($this->company, ['role' => 'salesman']);
        $colleague = $this->makeUser($this->company, ['role' => 'salesman']);

        $own = $this->makeLead($salesman);
        $this->makeLead($colleague);

        $visible = Lead::forUser($salesman)->pluck('id')->all();

        $this->assertSame([$own->id], $visible);
    }

    public function test_a_manager_also_sees_records_owned_by_direct_reports(): void
    {
        $manager = $this->makeUser($this->company, ['role' => 'manager']);
        $report = $this->makeUser($this->company, ['role' => 'salesman', 'manager_id' => $manager->id]);
        $outsider = $this->makeUser($this->company, ['role' => 'salesman']);

        $ownLead = $this->makeLead($manager);
        $reportLead = $this->makeLead($report);
        $this->makeLead($outsider);

        $visible = Lead::forUser($manager)->pluck('id')->all();

        sort($visible);
        $this->assertSame([$ownLead->id, $reportLead->id], $visible);
    }

    public function test_a_manager_does_not_see_records_of_another_managers_reports(): void
    {
        $manager = $this->makeUser($this->company, ['role' => 'manager']);
        $otherManager = $this->makeUser($this->company, ['role' => 'manager']);
        $otherReport = $this->makeUser($this->company, [
            'role' => 'salesman',
            'manager_id' => $otherManager->id,
        ]);

        $this->makeLead($otherReport);

        $this->assertSame(0, Lead::forUser($manager)->count());
    }

    public function test_models_without_an_owner_column_are_scoped_through_the_assignment_pivot(): void
    {
        $salesman = $this->makeUser($this->company, ['role' => 'salesman']);
        $colleague = $this->makeUser($this->company, ['role' => 'salesman']);

        $assigned = $this->makeCustomer([$salesman->id]);
        $this->makeCustomer([$colleague->id]);
        $this->makeCustomer();

        $this->assertSame([$assigned->id], Customer::forUser($salesman)->pluck('id')->all());
    }

    public function test_a_manager_sees_records_assigned_to_their_reports_through_the_pivot(): void
    {
        $manager = $this->makeUser($this->company, ['role' => 'manager']);
        $report = $this->makeUser($this->company, ['role' => 'salesman', 'manager_id' => $manager->id]);

        $reportCustomer = $this->makeCustomer([$report->id]);
        $this->makeCustomer([$this->makeUser($this->company, ['role' => 'salesman'])->id]);

        $this->assertSame([$reportCustomer->id], Customer::forUser($manager)->pluck('id')->all());
    }

    public function test_records_with_both_an_owner_column_and_a_pivot_match_either_side(): void
    {
        $salesman = $this->makeUser($this->company, ['role' => 'salesman']);
        $colleague = $this->makeUser($this->company, ['role' => 'salesman']);

        $owned = $this->makeDeal($salesman);
        $assigned = $this->makeDeal($colleague, [$salesman->id]);
        $this->makeDeal($colleague);

        $visible = Deal::forUser($salesman)->pluck('id')->all();

        sort($visible);
        $this->assertSame([$owned->id, $assigned->id], $visible);
    }
}
