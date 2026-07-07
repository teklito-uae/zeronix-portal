<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class MarketingSuppression extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'kind',
        'value',
        'type',
        'source_campaign_id',
        'notes',
        'created_by',
    ];

    public function sourceCampaign(): BelongsTo
    {
        return $this->belongsTo(MarketingCampaign::class, 'source_campaign_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Emails from $emails that are suppressed for $companyId (directly or via domain block).
     * Query is scope-independent (works in jobs / unauthenticated contexts).
     */
    public static function suppressedEmails(int $companyId, array $emails): array
    {
        if (empty($emails)) {
            return [];
        }

        $emails = array_map('strtolower', $emails);
        $domains = array_unique(array_filter(array_map(function ($email) {
            return substr(strrchr($email, '@'), 1) ?: null;
        }, $emails)));

        $suppressedEmails = static::withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->where('kind', 'email')
            ->whereIn('value', $emails)
            ->pluck('value')
            ->all();

        $blockedDomains = static::withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->where('kind', 'domain')
            ->whereIn('value', $domains)
            ->pluck('value')
            ->all();

        if (!empty($blockedDomains)) {
            $blocked = array_flip($blockedDomains);
            foreach ($emails as $email) {
                $domain = substr(strrchr($email, '@'), 1);
                if ($domain !== false && isset($blocked[$domain])) {
                    $suppressedEmails[] = $email;
                }
            }
        }

        return array_values(array_unique($suppressedEmails));
    }
}
