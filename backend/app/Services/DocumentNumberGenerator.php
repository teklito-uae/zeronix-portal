<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Carbon;

/**
 * Centralizes the "human-facing document number" generation that used to be
 * copy-pasted (with slight drift) across InvoiceController, SalesOrderController,
 * DeliveryController, QuoteController, PurchaseBillController, and several
 * model boot() methods (Deal, Lead, Customer, Supplier).
 *
 * All of those call sites used a "count existing rows for the period, add 1,
 * format string" approach with no locking, so two concurrent requests in the
 * same tenant/period could compute the same number. This service makes the
 * read-then-format step atomic via lockForUpdate(), but does NOT change the
 * output format of any existing number scheme.
 *
 * IMPORTANT: every method here must be called from inside an already-open
 * DB transaction (DB::beginTransaction()/DB::transaction()), and the caller
 * must perform the corresponding INSERT before that transaction commits.
 * lockForUpdate() only blocks other transactions for as long as the current
 * one is open — if the number is generated outside a transaction, or the
 * transaction is committed before the row is inserted, the lock is released
 * immediately and offers no protection.
 */
class DocumentNumberGenerator
{
    /**
     * Resolves a tenant-configurable document number prefix from
     * Company::settings (a JSON column, see WorkspaceSettingsController),
     * falling back to the historical hardcoded default when the tenant
     * hasn't customized it (or when there's no tenant scope at all, e.g.
     * a super_admin acting outside a company).
     *
     * This is for callers that only have a $companyId on hand (model
     * boot() closures). Controllers that already have the authenticated
     * $user loaded should keep using their existing
     * `$user->company->settings[...] ?? 'default'` inline pattern instead
     * of adding a query here.
     */
    public static function resolvePrefix(?int $companyId, string $settingsKey, string $default): string
    {
        if ($companyId === null) {
            return $default;
        }

        $settings = (array) (Company::find($companyId)?->settings ?? []);

        return $settings[$settingsKey] ?? $default;
    }

    /**
     * Reproduces the "{prefix}{Ymd}-{padded sequence}" scheme used by
     * SO-, DN-, INV- (delivery-flow), PB-, and the ZRNX-{XXX}- model codes.
     * The sequence resets daily and is based on a same-day row count,
     * exactly as before — just computed under a row lock so concurrent
     * callers can't read the same count before either has inserted.
     *
     * @param class-string<\Illuminate\Database\Eloquent\Model> $modelClass
     * @param int|null $companyId Explicit tenant scope. Pass null to intentionally
     *   count across all tenants (matches the previous behavior for a super_admin
     *   acting outside the BelongsToCompany scope). Pass a real company_id in
     *   every normal request path.
     */
    public static function nextDailySequence(
        string $modelClass,
        string $prefix,
        ?int $companyId,
        string $dateColumn = 'created_at',
        int $padLength = 3,
        bool $lock = true
    ): string {
        $date = Carbon::now()->format('Ymd');

        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = $modelClass::withoutGlobalScopes()
            ->whereDate($dateColumn, Carbon::today());

        if ($companyId !== null) {
            $query->where('company_id', $companyId);
        }

        if ($lock) {
            $query->lockForUpdate();
        }

        $count = $query->count() + 1;

        return $prefix . $date . '-' . str_pad((string) $count, $padLength, '0', STR_PAD_LEFT);
    }

    /**
     * Reproduces the "{prefix}{year}-{padded sequence}" scheme used by
     * Invoice::nextInvoiceNumber() and Quote::nextQuoteNumber(). The sequence
     * resets each calendar year and increments from the highest existing
     * suffix for that prefix (stable across deletions) rather than a row
     * count. Locking the matching rows before reading the max keeps two
     * concurrent callers from computing the same next sequence.
     *
     * @param class-string<\Illuminate\Database\Eloquent\Model> $modelClass
     */
    public static function nextYearlySequence(
        string $modelClass,
        string $numberColumn,
        string $prefix,
        ?int $companyId,
        int $padLength = 4,
        bool $lock = true
    ): string {
        $fullPrefix = $prefix . Carbon::now()->format('Y') . '-';

        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = $modelClass::withoutGlobalScopes()
            ->where($numberColumn, 'like', "{$fullPrefix}%");

        if ($companyId !== null) {
            $query->where('company_id', $companyId);
        }

        if ($lock) {
            $query->lockForUpdate();
        }

        $maxSeq = $query->get([$numberColumn])
            ->map(fn ($row) => (int) substr($row->{$numberColumn}, strlen($fullPrefix)))
            ->max() ?? 0;

        return $fullPrefix . str_pad((string) ($maxSeq + 1), $padLength, '0', STR_PAD_LEFT);
    }
}
