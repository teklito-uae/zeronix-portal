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

            // TEL — collect all occurrences
            $phones = [];
            if (preg_match_all('/^TEL[^:]*:(.+)$/mi', $block, $matches)) {
                foreach ($matches[1] as $phone) {
                    $phone = trim($phone);
                    if ($phone !== '') {
                        $phones[] = $phone;
                    }
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
            ];
        }

        return $rows;
    }

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
                $phones = array_values(array_filter(array_map('trim', $item['phones'])));
            } elseif (!empty($item['phone'])) {
                $phones = [trim((string) $item['phone'])];
            }

            $organizationName = $item['organization_name'] ?? $item['company'] ?? null;
            if ($organizationName !== null) {
                $organizationName = trim((string) $organizationName);
                if ($organizationName === '') {
                    $organizationName = null;
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

    private static function decodeVcfValue(string $value): string
    {
        // Handle quoted-printable encoding
        if (str_contains($value, '=')) {
            $value = quoted_printable_decode($value);
        }
        return trim($value);
    }
}
