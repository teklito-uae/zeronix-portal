<?php

namespace Tests\Unit\Support;

use App\Support\PhoneNormalizer;
use PHPUnit\Framework\TestCase;

class PhoneNormalizerTest extends TestCase
{
    public static function normalizationProvider(): array
    {
        return [
            'already e164' => ['+971501234567', '+971501234567'],
            'international dialing prefix' => ['00971501234567', '+971501234567'],
            'local leading zero' => ['0501234567', '+971501234567'],
            'bare subscriber number' => ['501234567', '+971501234567'],
            'spaces and dashes stripped' => ['050 123-4567', '+971501234567'],
            'parentheses and plus stripped' => ['+971 (50) 123 4567', '+971501234567'],
            'country code without plus' => ['971501234567', '+971501234567'],
            'landline local format' => ['042000000', '+97142000000'],
        ];
    }

    /**
     * @dataProvider normalizationProvider
     */
    public function test_it_normalizes_common_uae_formats_to_the_same_e164_value(string $raw, string $expected): void
    {
        $this->assertSame($expected, PhoneNormalizer::normalize($raw));
    }

    public function test_it_returns_null_for_null_input(): void
    {
        $this->assertNull(PhoneNormalizer::normalize(null));
    }

    public function test_it_returns_null_when_input_has_no_digits(): void
    {
        $this->assertNull(PhoneNormalizer::normalize(''));
        $this->assertNull(PhoneNormalizer::normalize('n/a'));
        $this->assertNull(PhoneNormalizer::normalize('---'));
    }

    public function test_a_number_already_prefixed_with_971_is_not_prefixed_again(): void
    {
        $this->assertSame('+971501234567', PhoneNormalizer::normalize('971-50-123-4567'));
    }
}
