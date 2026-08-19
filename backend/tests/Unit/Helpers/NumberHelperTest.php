<?php

namespace Tests\Unit\Helpers;

use App\Helpers\NumberHelper;
use PHPUnit\Framework\TestCase;

class NumberHelperTest extends TestCase
{
    public static function wordsProvider(): array
    {
        return [
            'zero' => [0, 'Zero'],
            'single digit' => [7, 'Seven'],
            'teen' => [13, 'Thirteen'],
            'exact ten' => [20, 'Twenty'],
            'hyphenated tens' => [42, 'Forty-Two'],
            'exact hundred' => [100, 'One Hundred'],
            'hundred with remainder under 100' => [115, 'One Hundred and Fifteen'],
            'hundred with tens remainder' => [999, 'Nine Hundred and Ninety-Nine'],
            'exact thousand' => [1000, 'One Thousand'],
            'thousand with small remainder' => [1005, 'One Thousand and Five'],
            'thousand with large remainder' => [1234, 'One Thousand, Two Hundred and Thirty-Four'],
            'million' => [2000000, 'Two Million'],
            'billion with remainder' => [1000000001, 'One Billion and One'],
        ];
    }

    /**
     * @dataProvider wordsProvider
     */
    public function test_it_spells_out_integers(int $number, string $expected): void
    {
        $this->assertSame($expected, NumberHelper::toWords($number));
    }

    public function test_it_prefixes_negative_numbers(): void
    {
        $this->assertSame('negative Twenty-One', NumberHelper::toWords(-21));
    }

    public function test_it_ignores_the_fractional_part_and_spells_only_the_integer_part(): void
    {
        $this->assertSame('One Hundred and Fifty', NumberHelper::toWords(150.75));
    }

    public function test_it_accepts_numeric_strings(): void
    {
        $this->assertSame('One Thousand, Two Hundred and Thirty-Four', NumberHelper::toWords('1234'));
    }

    public function test_it_returns_false_for_non_numeric_input(): void
    {
        $this->assertFalse(NumberHelper::toWords('abc'));
        $this->assertFalse(NumberHelper::toWords(''));
        $this->assertFalse(NumberHelper::toWords(null));
    }
}
