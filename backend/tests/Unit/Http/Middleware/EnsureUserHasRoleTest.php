<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\EnsureUserHasRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

class EnsureUserHasRoleTest extends TestCase
{
    private function request(?User $user): Request
    {
        $request = Request::create('/admin/customers');

        if ($user !== null) {
            $request->setUserResolver(fn () => $user);
        }

        return $request;
    }

    private function handle(Request $request, string ...$roles): \Symfony\Component\HttpFoundation\Response
    {
        return (new EnsureUserHasRole())->handle(
            $request,
            fn () => new Response('ok'),
            ...$roles
        );
    }

    public function test_it_passes_the_request_through_for_an_allowed_role(): void
    {
        $response = $this->handle($this->request(new User(['role' => 'admin'])), 'admin', 'super_admin');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('ok', $response->getContent());
    }

    public function test_it_accepts_any_of_the_listed_roles(): void
    {
        $response = $this->handle($this->request(new User(['role' => 'super_admin'])), 'admin', 'super_admin');

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_it_forbids_a_role_that_is_not_listed(): void
    {
        $response = $this->handle($this->request(new User(['role' => 'sales'])), 'admin');

        $this->assertSame(403, $response->getStatusCode());
        $this->assertStringContainsString('Forbidden', $response->getContent());
    }

    public function test_it_forbids_an_unauthenticated_request(): void
    {
        $this->assertSame(403, $this->handle($this->request(null), 'admin')->getStatusCode());
    }

    public function test_it_forbids_a_user_with_no_role_at_all(): void
    {
        $this->assertSame(403, $this->handle($this->request(new User()), 'admin')->getStatusCode());
    }

    public function test_it_forbids_when_no_roles_are_allowed(): void
    {
        $this->assertSame(403, $this->handle($this->request(new User(['role' => 'admin'])))->getStatusCode());
    }

    public function test_role_matching_is_case_sensitive_and_strict(): void
    {
        $this->assertSame(403, $this->handle($this->request(new User(['role' => 'Admin'])), 'admin')->getStatusCode());
    }
}
