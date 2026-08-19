<?php

namespace Tests\Unit\Services;

use App\Models\Company;
use App\Services\DocumentNumberGenerator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

/**
 * Test-only model standing in for the many real documents this service
 * numbers (Invoice, Quote, SalesOrder, Delivery, PurchaseBill, Deal, Lead,
 * Customer, Supplier). The service is generic over the model class, so
 * exercising it against a purpose-built table keeps these tests independent
 * of the app's legacy migration history.
 */
class DocumentNumberTestDoc extends Model
{
    protected $table = 'document_number_test_docs';

    protected $fillable = ['company_id', 'number'];
}

class DocumentNumberGeneratorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // A throwaway in-memory schema — only the two tables this service
        // touches, rather than the full (MySQL-only) migration history.
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge('sqlite');

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('document_number_test_docs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->string('number')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function makeDoc(?int $companyId, ?string $number = null, ?string $createdAt = null): DocumentNumberTestDoc
    {
        $doc = DocumentNumberTestDoc::create(['company_id' => $companyId, 'number' => $number]);

        if ($createdAt !== null) {
            $doc->forceFill(['created_at' => $createdAt])->save();
        }

        return $doc;
    }

    public function test_resolve_prefix_returns_the_default_when_there_is_no_company_scope(): void
    {
        $this->assertSame('INV-', DocumentNumberGenerator::resolvePrefix(null, 'invoice_prefix', 'INV-'));
    }

    public function test_resolve_prefix_returns_the_default_when_the_company_has_not_customized_it(): void
    {
        $noSettings = Company::create(['name' => 'No Settings']);
        $otherKey = Company::create(['name' => 'Other Key', 'settings' => ['quote_prefix' => 'QT-']]);

        $this->assertSame('INV-', DocumentNumberGenerator::resolvePrefix($noSettings->id, 'invoice_prefix', 'INV-'));
        $this->assertSame('INV-', DocumentNumberGenerator::resolvePrefix($otherKey->id, 'invoice_prefix', 'INV-'));
    }

    public function test_resolve_prefix_returns_the_tenant_configured_prefix(): void
    {
        $company = Company::create(['name' => 'Falcon', 'settings' => ['invoice_prefix' => 'FT-INV-']]);

        $this->assertSame('FT-INV-', DocumentNumberGenerator::resolvePrefix($company->id, 'invoice_prefix', 'INV-'));
    }

    public function test_resolve_prefix_returns_the_default_for_an_unknown_company_id(): void
    {
        $this->assertSame('INV-', DocumentNumberGenerator::resolvePrefix(9999, 'invoice_prefix', 'INV-'));
    }

    public function test_next_daily_sequence_starts_at_one_and_embeds_todays_date(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->assertSame(
            'SO-20260304-001',
            DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'SO-', 1, 'created_at', 3, false)
        );
    }

    public function test_next_daily_sequence_counts_only_todays_rows_for_the_same_tenant(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1);
        $this->makeDoc(1);
        $this->makeDoc(2); // other tenant
        $this->makeDoc(1, null, '2026-03-03 10:00:00'); // yesterday

        $this->assertSame(
            'SO-20260304-003',
            DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'SO-', 1, 'created_at', 3, false)
        );
    }

    public function test_next_daily_sequence_counts_across_all_tenants_when_company_id_is_null(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1);
        $this->makeDoc(2);

        $this->assertSame(
            'SO-20260304-003',
            DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'SO-', null, 'created_at', 3, false)
        );
    }

    public function test_next_daily_sequence_resets_on_a_new_day(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');
        $this->makeDoc(1);

        Carbon::setTestNow('2026-03-05 10:00:00');

        $this->assertSame(
            'SO-20260305-001',
            DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'SO-', 1, 'created_at', 3, false)
        );
    }

    public function test_next_daily_sequence_honors_the_pad_length(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->assertSame(
            'PB-20260304-00001',
            DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'PB-', 1, 'created_at', 5, false)
        );
    }

    public function test_next_yearly_sequence_starts_at_one_and_embeds_the_current_year(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->assertSame(
            'INV-2026-0001',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false)
        );
    }

    public function test_next_yearly_sequence_increments_from_the_highest_existing_suffix(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1, 'INV-2026-0001');
        $this->makeDoc(1, 'INV-2026-0007');
        $this->makeDoc(1, 'INV-2026-0003');

        $this->assertSame(
            'INV-2026-0008',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false)
        );
    }

    public function test_next_yearly_sequence_does_not_reuse_a_number_when_an_earlier_row_is_deleted(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1, 'INV-2026-0001')->delete();
        $this->makeDoc(1, 'INV-2026-0002');

        $this->assertSame(
            'INV-2026-0003',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false)
        );
    }

    public function test_next_yearly_sequence_ignores_other_prefixes_years_and_tenants(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1, 'QT-2026-0009');
        $this->makeDoc(1, 'INV-2025-0009');
        $this->makeDoc(2, 'INV-2026-0009');

        $this->assertSame(
            'INV-2026-0001',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false)
        );
    }

    public function test_next_yearly_sequence_spans_tenants_when_company_id_is_null(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $this->makeDoc(1, 'INV-2026-0004');
        $this->makeDoc(2, 'INV-2026-0011');

        $this->assertSame(
            'INV-2026-0012',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', null, 4, false)
        );
    }

    public function test_next_yearly_sequence_resets_on_a_new_year(): void
    {
        Carbon::setTestNow('2026-12-31 23:00:00');
        $this->makeDoc(1, DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false));

        Carbon::setTestNow('2027-01-01 00:00:00');

        $this->assertSame(
            'INV-2027-0001',
            DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1, 4, false)
        );
    }

    public function test_generating_inside_a_transaction_with_the_lock_enabled_still_produces_a_number(): void
    {
        Carbon::setTestNow('2026-03-04 10:00:00');

        $numbers = DB::transaction(function () {
            $daily = DocumentNumberGenerator::nextDailySequence(DocumentNumberTestDoc::class, 'SO-', 1);
            $this->makeDoc(1, $daily);

            $yearly = DocumentNumberGenerator::nextYearlySequence(DocumentNumberTestDoc::class, 'number', 'INV-', 1);

            return [$daily, $yearly];
        });

        $this->assertSame(['SO-20260304-001', 'INV-2026-0001'], $numbers);
    }
}
