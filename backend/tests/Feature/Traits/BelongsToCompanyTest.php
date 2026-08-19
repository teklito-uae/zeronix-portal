<?php

namespace Tests\Feature\Traits;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Tag;
use Illuminate\Database\QueryException;
use Tests\Feature\FullSchemaTestCase;

class BelongsToCompanyTest extends FullSchemaTestCase
{
    /**
     * Authenticate a portal customer on the `customer` guard only, leaving the
     * default guard unauthenticated — the shape a real /portal request has.
     */
    private function loginCustomerOf(Company $company): Customer
    {
        $customer = Customer::withoutGlobalScope('company')->create([
            'name' => 'Portal Customer',
            'company_id' => $company->id,
        ]);

        auth()->guard('customer')->setUser($customer);

        return $customer;
    }

    private function makeTag(Company $company, string $name): Tag
    {
        return Tag::withoutGlobalScope('company')->create([
            'company_id' => $company->id,
            'name' => $name,
        ]);
    }

    public function test_queries_are_scoped_to_the_authenticated_users_company(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'salesman']);
        $ours = $this->makeTag($company, 'ours');
        $this->makeTag($this->makeCompany(), 'theirs');

        $this->actingAs($user);

        $this->assertSame([$ours->id], Tag::pluck('id')->all());
    }

    public function test_a_super_admin_sees_every_companys_records(): void
    {
        $company = $this->makeCompany();
        $superAdmin = $this->makeUser($company, ['role' => 'super_admin']);
        $this->makeTag($company, 'ours');
        $this->makeTag($this->makeCompany(), 'theirs');

        $this->actingAs($superAdmin);

        $this->assertSame(2, Tag::count());
    }

    public function test_a_user_without_a_company_is_not_scoped(): void
    {
        $companyless = $this->makeUser($this->makeCompany(), ['role' => 'admin', 'company_id' => null]);
        $this->makeTag($this->makeCompany(), 'a');
        $this->makeTag($this->makeCompany(), 'b');

        $this->actingAs($companyless);

        $this->assertSame(2, Tag::count());
    }

    public function test_queries_are_scoped_to_an_authenticated_customers_company(): void
    {
        $company = $this->makeCompany();
        $ours = $this->makeTag($company, 'ours');
        $this->makeTag($this->makeCompany(), 'theirs');

        $this->loginCustomerOf($company);

        $this->assertSame([$ours->id], Tag::pluck('id')->all());
    }

    public function test_unauthenticated_queries_are_not_scoped(): void
    {
        $this->makeTag($this->makeCompany(), 'a');
        $this->makeTag($this->makeCompany(), 'b');

        $this->assertSame(2, Tag::count());
    }

    public function test_company_id_is_filled_from_the_authenticated_user_on_create(): void
    {
        $company = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'salesman']);

        $this->actingAs($user);

        $tag = Tag::create(['name' => 'auto-scoped']);

        $this->assertSame($company->id, $tag->company_id);
    }

    public function test_an_explicit_company_id_is_not_overwritten(): void
    {
        $company = $this->makeCompany();
        $other = $this->makeCompany();
        $user = $this->makeUser($company, ['role' => 'salesman']);

        $this->actingAs($user);

        $tag = Tag::create(['company_id' => $other->id, 'name' => 'explicit']);

        $this->assertSame($other->id, $tag->company_id);
    }

    /**
     * A super_admin is deliberately not stamped with their own company, so a
     * tenant-scoped row they create must name its tenant explicitly — the
     * insert otherwise hits the column's NOT NULL constraint.
     */
    public function test_a_super_admin_does_not_stamp_their_own_company_on_create(): void
    {
        $company = $this->makeCompany();
        $superAdmin = $this->makeUser($company, ['role' => 'super_admin']);

        $this->actingAs($superAdmin);

        $this->expectException(QueryException::class);

        Tag::create(['name' => 'platform-wide']);
    }

    public function test_company_id_is_filled_from_the_authenticated_customer_on_create(): void
    {
        $company = $this->makeCompany();
        $this->loginCustomerOf($company);

        $tag = Tag::create(['name' => 'from-portal']);

        $this->assertSame($company->id, $tag->company_id);
    }

    public function test_the_company_relation_resolves_the_owning_tenant(): void
    {
        $company = $this->makeCompany();
        $tag = $this->makeTag($company, 'ours');

        $this->assertSame($company->id, $tag->company->id);
    }
}
