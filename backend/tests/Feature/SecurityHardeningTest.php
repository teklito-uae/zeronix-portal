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
    private array $temporaryAttachmentPaths = [];

    protected function tearDown(): void
    {
        foreach ($this->temporaryAttachmentPaths as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

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

    public function test_business_attachments_are_accepted_and_stored_safely(): void
    {
        Storage::fake('public');
        $uploads = [
            $this->makeUpload('invoice.pdf', "%PDF-1.7\n"),
            $this->makeZipUpload('document.docx', 'word/document.xml'),
            $this->makeZipUpload('spreadsheet.xlsx', 'xl/workbook.xml'),
            $this->makeUpload('records.csv', "name,total\nAcme,100\n"),
        ];

        $allowedExtensions = ['pdf', 'docx', 'xlsx', 'csv', 'txt'];

        foreach ($uploads as $upload) {
            $validator = Validator::make(['file' => $upload], ['file' => AttachmentSecurity::rules()]);

            $this->assertFalse($validator->fails(), $upload->getClientOriginalName());

            $derivedExtension = strtolower($upload->extension());
            $this->assertContains($derivedExtension, $allowedExtensions);

            $path = AttachmentSecurity::store($upload, 'security-test');
            $this->assertStringEndsWith('.' . $derivedExtension, $path);
            $this->assertDoesNotMatchRegularExpression('/\.(?:php|phtml|phar|sh)$/i', $path);
            Storage::disk('public')->assertExists($path);
        }
    }

    public function test_executable_and_mismatched_attachments_are_rejected(): void
    {
        $uploads = [
            $this->makeUpload('payload.php', '<?php echo "unsafe";'),
            $this->makeUpload('payload.phtml', '<?php echo "unsafe";'),
            $this->makeUpload('payload.sh', "#!/bin/sh\necho unsafe\n"),
            $this->makeUpload('payload.php.pdf', '<?php echo "unsafe";'),
        ];

        foreach ($uploads as $upload) {
            $this->assertTrue(
                Validator::make(['file' => $upload], ['file' => AttachmentSecurity::rules()])->fails(),
                $upload->getClientOriginalName()
            );
        }
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

    private function makeUpload(string $name, string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'security-attachment-');
        $this->temporaryAttachmentPaths[] = $path;
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, UPLOAD_ERR_OK, true);
    }

    private function makeZipUpload(string $name, string $entry): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'security-attachment-');
        $this->temporaryAttachmentPaths[] = $path;
        $zip = new \ZipArchive();
        $zip->open($path);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types/>');
        $zip->addFromString('_rels/.rels', '<Relationships/>');
        $zip->addFromString($entry, '<document/>');
        $zip->close();

        return new UploadedFile($path, $name, null, UPLOAD_ERR_OK, true);
    }
}
