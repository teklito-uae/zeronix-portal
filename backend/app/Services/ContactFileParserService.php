<?php

namespace App\Services;

/**
 * Parses .vcf (vCard) and .json contact export files into a common
 * per-contact row shape used by the Google Contacts / file-import lead flow.
 */
class ContactFileParserService
{
    /**
     * @return array<int, array{
     *     first_name: string,
     *     last_name: ?string,
     *     full_name: string,
     *     emails: string[],
     *     phones: string[],
     *     organization_name: ?string
     * }>
     */
    public static function parseVcf(string $content): array
    {
        $rows   = [];
        $blocks = preg_split('/BEGIN:VCARD/i', $content);

        foreach ($blocks as $block) {
            if (empty(trim($block))) {
                continue;
            }

            $fullName = null;

            // FN (Full Name)
            if (preg_match('/^FN[^:]*:(.+)$/mi', $block, $m)) {
                $fullName = self::decodeVcfValue(trim($m[1]));
            }

            if (empty($fullName)) {
                continue;
            }

            // EMAIL — collect all occurrences
            $emails = [];
            if (preg_match_all('/^EMAIL[^:]*:(.+)$/mi', $block, $matches)) {
                foreach ($matches[1] as $email) {
                    $email = trim($email);
                    if ($email !== '') {
                        $emails[] = $email;
                    }
                }
            }

            // TEL — collect all occurrences. A single TEL line sometimes packs
            // more than one number separated by ":::" (seen in some exports),
            // so each match is split before being added.
            $phones = [];
            if (preg_match_all('/^TEL[^:]*:(.+)$/mi', $block, $matches)) {
                foreach ($matches[1] as $rawPhone) {
                    $phones = array_merge($phones, self::splitPhoneValue($rawPhone));
                }
            }

            // ORG
            $organizationName = null;
            if (preg_match('/^ORG[^:]*:(.+)$/mi', $block, $m)) {
                $organizationName = self::decodeVcfValue(trim(explode(';', $m[1])[0]));
                if ($organizationName === '') {
                    $organizationName = null;
                }
            }

            [$firstName, $lastName] = self::splitName($fullName);

            $rows[] = [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'emails' => array_values(array_unique($emails)),
                'phones' => array_values(array_unique($phones)),
                'organization_name' => $organizationName,
                'notes' => null,
            ];
        }

        return $rows;
    }

    /**
     * Parses a CSV export with a header row. Column names are matched
     * case-insensitively against a small set of common aliases, so exports
     * from Google Contacts (which splits names into First/Middle/Last and
     * numbers repeatable fields as "Phone 1 - Value", "E-mail 1 - Value",
     * etc.), Outlook, or a plain name/email/phone spreadsheet all work.
     *
     * Only the columns we actually store on a Lead (name, company, email,
     * phone, notes) are extracted — everything else in the export (address,
     * birthday, photo, labels, ...) is ignored.
     *
     * @return array<int, array{
     *     first_name: string,
     *     last_name: ?string,
     *     full_name: string,
     *     emails: string[],
     *     phones: string[],
     *     organization_name: ?string,
     *     notes: ?string
     * }>
     */
    public static function parseCsv(string $content): array
    {
        // Strip a UTF-8 BOM, which Excel/Google Contacts commonly prepends.
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        // Parse via a stream (rather than splitting on newlines first) so that
        // quoted fields containing embedded newlines — e.g. a multi-line Notes
        // column — are handled correctly.
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $content);
        rewind($stream);

        $header = fgetcsv($stream);
        if ($header === false) {
            fclose($stream);
            return [];
        }
        $header = array_map(fn ($h) => strtolower(trim($h)), $header);

        $columns = [];
        foreach ($header as $i => $h) {
            $columns[$h] = $i;
        }

        $colIndex = function (array $aliases) use ($columns) {
            foreach ($aliases as $alias) {
                if (isset($columns[$alias])) {
                    return $columns[$alias];
                }
            }
            return null;
        };

        $nameIdx = $colIndex(['name', 'full name', 'full_name']);
        $firstIdx = $colIndex(['first name', 'first_name', 'firstname']);
        $middleIdx = $colIndex(['middle name', 'middle_name']);
        $lastIdx = $colIndex(['last name', 'last_name', 'lastname']);
        $fileAsIdx = $colIndex(['file as']);
        $companyIdx = $colIndex(['company', 'organization', 'organisation', 'business name', 'organization name']);
        $notesIdx = $colIndex(['notes', 'note', 'remarks']);

        // Google Contacts repeats email/phone as numbered columns
        // ("E-mail 1 - Value", "Phone 2 - Value", ...) rather than one column
        // each, so collect every matching column instead of a single index.
        $emailIndices = [];
        $phoneIndices = [];
        foreach ($header as $i => $h) {
            if (preg_match('/^e-?mail(\s*\d+)?\s*-\s*value$/', $h) || in_array($h, ['email', 'email address', 'e-mail'], true)) {
                $emailIndices[] = $i;
            }
            if (preg_match('/^phone(\s*\d+)?\s*-\s*value$/', $h) || in_array($h, ['phone', 'phone number', 'mobile', 'contact number', 'tel'], true)) {
                $phoneIndices[] = $i;
            }
        }

        $rows = [];
        while (($cols = fgetcsv($stream)) !== false) {
            if (count($cols) === 1 && trim((string) $cols[0]) === '') {
                continue;
            }

            $get = fn (?int $idx) => $idx !== null && isset($cols[$idx]) && trim((string) $cols[$idx]) !== '' ? trim((string) $cols[$idx]) : null;

            $fullName = $get($nameIdx);
            if (empty($fullName)) {
                $parts = array_filter([$get($firstIdx), $get($middleIdx), $get($lastIdx)], fn ($p) => $p !== null);
                $fullName = trim(implode(' ', $parts));
            }
            if (empty($fullName)) {
                $fullName = $get($fileAsIdx);
            }
            if (empty($fullName)) {
                // Company-only entry (e.g. Google Contacts business card) — still
                // worth importing as a lead, named after the organization.
                $fullName = $get($companyIdx);
            }
            if (empty($fullName)) {
                continue;
            }

            [$firstName, $lastName] = $firstIdx !== null
                ? [$get($firstIdx) ?? $fullName, $get($lastIdx)]
                : self::splitName($fullName);

            $emails = [];
            foreach ($emailIndices as $i) {
                $v = isset($cols[$i]) ? trim((string) $cols[$i]) : '';
                if ($v !== '') {
                    $emails[] = $v;
                }
            }

            $phones = [];
            foreach ($phoneIndices as $i) {
                $v = isset($cols[$i]) ? trim((string) $cols[$i]) : '';
                if ($v !== '') {
                    $phones = array_merge($phones, self::splitPhoneValue($v));
                }
            }

            $rows[] = [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'emails' => array_values(array_unique($emails)),
                'phones' => array_values(array_unique($phones)),
                'organization_name' => $get($companyIdx),
                'notes' => $get($notesIdx),
            ];
        }

        fclose($stream);

        return $rows;
    }

    /**
     * @return array<int, array{
     *     first_name: string,
     *     last_name: ?string,
     *     full_name: string,
     *     emails: string[],
     *     phones: string[],
     *     organization_name: ?string,
     *     notes: ?string
     * }>
     */
    public static function parseJson(string $content): array
    {
        $data = json_decode($content, true);
        if (!is_array($data)) {
            return [];
        }

        $rows = [];
        foreach ($data as $item) {
            if (!is_array($item)) {
                continue;
            }

            $fullName = null;
            if (!empty($item['name'])) {
                $fullName = trim((string) $item['name']);
            } elseif (!empty($item['first_name'])) {
                $fullName = trim((string) $item['first_name'] . ' ' . ($item['last_name'] ?? ''));
            }

            if (empty($fullName)) {
                continue;
            }

            $emails = [];
            if (!empty($item['emails']) && is_array($item['emails'])) {
                $emails = array_values(array_filter(array_map('trim', $item['emails'])));
            } elseif (!empty($item['email'])) {
                $emails = [trim((string) $item['email'])];
            }

            $phones = [];
            if (!empty($item['phones']) && is_array($item['phones'])) {
                foreach ($item['phones'] as $rawPhone) {
                    $phones = array_merge($phones, self::splitPhoneValue((string) $rawPhone));
                }
            } elseif (!empty($item['phone'])) {
                $phones = self::splitPhoneValue((string) $item['phone']);
            }

            $organizationName = $item['organization_name'] ?? $item['company'] ?? null;
            if ($organizationName !== null) {
                $organizationName = trim((string) $organizationName);
                if ($organizationName === '') {
                    $organizationName = null;
                }
            }

            $notes = $item['notes'] ?? null;
            if ($notes !== null) {
                $notes = trim((string) $notes);
                if ($notes === '') {
                    $notes = null;
                }
            }

            if (!empty($item['first_name'])) {
                $firstName = trim((string) $item['first_name']);
                $lastName = isset($item['last_name']) ? trim((string) $item['last_name']) : null;
                if ($lastName === '') {
                    $lastName = null;
                }
            } else {
                [$firstName, $lastName] = self::splitName($fullName);
            }

            $rows[] = [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'emails' => array_values(array_unique($emails)),
                'phones' => array_values(array_unique($phones)),
                'organization_name' => $organizationName,
                'notes' => $notes,
            ];
        }

        return $rows;
    }

    /**
     * Best-effort split of a full name into first/last on the first whitespace.
     *
     * @return array{0: string, 1: ?string}
     */
    private static function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName), 2);
        $firstName = $parts[0] ?? $fullName;
        $lastName = $parts[1] ?? null;
        if ($lastName === '') {
            $lastName = null;
        }
        return [$firstName, $lastName];
    }

    /**
     * Splits a single phone field that packs multiple numbers together,
     * separated by ":::" (e.g. "050-382-1311 ::: 050-382-1311"). Duplicate
     * numbers collapse to one; a plain single-number value passes through
     * unchanged as a one-element array.
     *
     * @return string[]
     */
    private static function splitPhoneValue(string $value): array
    {
        $parts = array_map('trim', preg_split('/\s*:::\s*/', $value));
        return array_values(array_unique(array_filter($parts, fn ($p) => $p !== '')));
    }

    private static function decodeVcfValue(string $value): string
    {
        // Handle quoted-printable encoding
        if (str_contains($value, '=')) {
            $value = quoted_printable_decode($value);
        }
        return trim($value);
    }
}
