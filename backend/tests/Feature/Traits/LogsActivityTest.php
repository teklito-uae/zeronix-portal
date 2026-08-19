<?php

namespace Tests\Feature\Traits;

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use Tests\Feature\FullSchemaTestCase;

class LogsActivityTest extends FullSchemaTestCase
{
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = $this->makeCompany();
    }

    private function makeLead(?User $owner = null): Lead
    {
        $lead = new Lead(array_filter([
            'name' => 'Lead ' . uniqid(),
            'user_id' => $owner?->id,
        ]));
        $lead->company_id = $this->company->id;
        $lead->save();

        return $lead;
    }

    public function test_nothing_is_logged_for_unauthenticated_writes(): void
    {
        $lead = $this->makeLead();
        $lead->update(['name' => 'Renamed']);
        $lead->delete();

        $this->assertSame(0, ActivityLog::withoutGlobalScope('company')->count());
    }

    public function test_creating_a_model_logs_the_acting_user(): void
    {
        $user = $this->makeUser($this->company, ['name' => 'Dana', 'role' => 'salesman']);
        $this->actingAs($user);

        $lead = $this->makeLead($user);

        $log = ActivityLog::withoutGlobalScope('company')->sole();
        $this->assertSame('created_lead', $log->action);
        $this->assertSame(Lead::class, $log->subject_type);
        $this->assertSame($lead->id, $log->subject_id);
        $this->assertSame($user->id, $log->user_id);
        $this->assertNull($log->customer_id);
        $this->assertSame("Dana created Lead #{$lead->id}", $log->description);
        $this->assertNull($log->properties);
    }

    public function test_updating_a_model_records_the_changed_attributes(): void
    {
        $user = $this->makeUser($this->company, ['name' => 'Dana', 'role' => 'salesman']);
        $lead = $this->makeLead($user);

        $this->actingAs($user);
        $lead->update(['name' => 'Renamed', 'status' => 'contacted']);

        $log = ActivityLog::withoutGlobalScope('company')->where('action', 'updated_lead')->sole();
        $this->assertSame(
            ['name' => 'Renamed', 'status' => 'contacted'],
            $log->properties['changes']
        );
        $this->assertSame("Dana updated Lead #{$lead->id}", $log->description);
    }

    public function test_deleting_a_model_is_logged_without_changes(): void
    {
        $user = $this->makeUser($this->company, ['name' => 'Dana', 'role' => 'salesman']);
        $lead = $this->makeLead($user);
        $leadId = $lead->id;

        $this->actingAs($user);
        $lead->delete();

        $log = ActivityLog::withoutGlobalScope('company')->where('action', 'deleted_lead')->sole();
        $this->assertSame($leadId, $log->subject_id);
        $this->assertNull($log->properties);
    }

    public function test_a_portal_customer_is_logged_as_the_customer_not_a_user(): void
    {
        $customer = Customer::withoutGlobalScope('company')->create([
            'name' => 'Portal Pete',
            'company_id' => $this->company->id,
        ]);

        $this->actingAs($customer, 'customer');

        $lead = $this->makeLead();

        $log = ActivityLog::withoutGlobalScope('company')
            ->where('subject_id', $lead->id)
            ->where('action', 'created_lead')
            ->sole();

        $this->assertNull($log->user_id);
        $this->assertSame($customer->id, $log->customer_id);
        $this->assertSame("Portal Pete (Customer) created Lead #{$lead->id}", $log->description);
    }
}
