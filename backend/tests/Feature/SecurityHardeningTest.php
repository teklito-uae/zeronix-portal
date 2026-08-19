<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use App\Support\AttachmentSecurity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    public function test_customer_tokens_cannot_access_staff_routes(): void
    {
        Sanctum::actingAs(new Customer(['company_id' => 1]), ['*']);

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/staff/users')->assertForbidden();
    }

    public function test_staff_tokens_cannot_access_customer_routes(): void
    {
        Sanctum::actingAs(new User(['role' => 'admin', 'company_id' => 1]), ['*']);

        $this->getJson('/api/customer/invoices')->assertForbidden();
    }

    public function test_same_principal_type_can_access_its_routes(): void
    {
        Sanctum::actingAs(new User(['role' => 'admin', 'company_id' => 1]), ['*']);
        $this->getJson('/api/admin/user')->assertOk();

        Sanctum::actingAs(new Customer(['company_id' => null]), ['*']);
        $this->getJson('/api/customer/settings/workspace')->assertOk();
    }

    public function test_customer_without_company_id_sees_no_products(): void
    {
        if (!Schema::hasTable('products')) {
            Schema::create('products', function ($table) {
                $table->id();
                $table->unsignedBigInteger('company_id')->nullable();
                $table->string('name')->nullable();
            });
        }

        try {
            \DB::table('products')->insert(['company_id' => 1, 'name' => 'Tenant product']);

            Sanctum::actingAs(new Customer(['company_id' => null]), ['*']);

            $this->assertSame(0, \App\Models\Product::query()->count());
            $this->assertSame(1, \App\Models\Product::withoutGlobalScopes()->count());
        } finally {
            Schema::dropIfExists('products');
        }
    }

    public function test_public_document_and_customer_registration_routes_are_removed(): void
    {
        $this->getJson('/api/portal/invoices/INV-1/view')->assertNotFound();
        $this->getJson('/api/portal/invoices/INV-1/download')->assertNotFound();
        $this->getJson('/api/admin/invoices/1/view')->assertUnauthorized();
        $this->getJson('/api/admin/receipts/1/download')->assertNotFound();
        $this->postJson('/api/customer/register', [])->assertNotFound();
    }

    public function test_php_attachment_is_rejected_and_pdf_attachment_is_accepted(): void
    {
        $php = UploadedFile::fake()->create('payload.php', 1, 'application/x-php');
        $pdf = UploadedFile::fake()->create('invoice.pdf', 1, 'application/pdf');

        $this->assertTrue(Validator::make(['file' => $php], ['file' => AttachmentSecurity::rules()])->fails());
        $this->assertFalse(Validator::make(['file' => $pdf], ['file' => AttachmentSecurity::rules()])->fails());

        Storage::fake('public');
        $path = AttachmentSecurity::store($pdf, 'security-test');
        $this->assertStringEndsWith('.pdf', $path);
        $this->assertStringNotContainsString('.php', $path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_authentication_limiter_returns_429_after_repeated_bad_logins(): void
    {
        RateLimiter::clear('not-an-email|127.0.0.1');

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/customer/login', [
                'email' => 'not-an-email',
                'password' => 'incorrect-password',
            ]);
        }

        $this->postJson('/api/customer/login', [
            'email' => 'not-an-email',
            'password' => 'incorrect-password',
        ])->assertStatus(429);
    }
}
