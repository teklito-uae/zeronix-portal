<?php

namespace App\Support;

/**
 * Normalizes phone numbers into UAE E.164 form (+971XXXXXXXXX) so a phone
 * number typed/pasted in any common local format still matches the same
 * stored phone_e164 value.
 */
class PhoneNormalizer
{
    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $raw);

        if ($digits === null || $digits === '') {
            return null;
        }

        // 00971XXXXXXXXX (international dialing prefix) -> 971XXXXXXXXX
        if (str_starts_with($digits, '00971')) {
            $digits = substr($digits, 2);
        }

        // 0XXXXXXXXX (local format) -> 971XXXXXXXXX
        if (str_starts_with($digits, '0') && !str_starts_with($digits, '971')) {
            $digits = '971' . substr($digits, 1);
        }

        // Bare local subscriber number with no leading 0 (e.g. "501234567")
        if (!str_starts_with($digits, '971')) {
            $digits = '971' . $digits;
        }

        return '+' . $digits;
    }
}
