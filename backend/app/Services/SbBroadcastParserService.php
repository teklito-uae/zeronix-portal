<?php

namespace App\Services;

/**
 * Deterministic, rules-based parser for supplier WhatsApp broadcast text
 * (free-form price lists) into structured product rows. No AI/ML — that's
 * a Phase 3 concern. Must never throw: a parser failure should never block
 * a broadcast import, it should just degrade to a low-confidence raw row.
 */
class SbBroadcastParserService
{
    private const PRICE_PATTERNS = [
        '/AED\s?([\d,]+(?:\.\d{1,2})?)/i' => 'AED',
        '/([\d,]+(?:\.\d{1,2})?)\s?AED/i' => 'AED',
        '/\$\s?([\d,]+(?:\.\d{1,2})?)/' => 'USD',
        '/USD\s?([\d,]+(?:\.\d{1,2})?)/i' => 'USD',
        '/Price:\s*([\d,]+(?:\.\d{1,2})?)/i' => null,
    ];

    private const CPU_PATTERNS = [
        // Most specific first: series + tier + model number (+ suffix), so a
        // bare fallback pattern below never gets a chance to truncate a
        // longer, more informative match (e.g. "i7-1165G7" instead of "i7").
        '/(?:Intel\s+)?Core\s+Ultra\s+[3579]\s?-?\s?\d{2,3}[A-Z]{0,2}/i',
        '/\bUltra\s+[3579]\s?-?\s?\d{2,3}[A-Z]{0,2}\b/i',
        '/(?:Intel\s+)?Core\s+i[3579]\s?-?\s?[\dA-Z]{3,7}(?:\s?vPro)?/i',
        '/(?:Intel\s+)?Core\s+\d\s?-?\s?[\dA-Z]{3,7}/i',
        '/\bi[3579]\s?-?\s?[\dA-Z]{3,7}\b/i',
        '/\bi[3579]\b/i',
        '/Ryzen\s?\d\s?\d{3,5}[A-Z]{0,2}/i',
        '/Ryzen\s?\d/i',
        '/Snapdragon\s?\d+/i',
        '/Dimensity\s?\d+/i',
        '/Exynos\s?\d+/i',
        '/A1[5-9]\s?Bionic/i',
    ];

    // Emoji / pictographic unicode blocks + WhatsApp decoration characters
    // commonly found in supplier broadcast pastes (bullets, arrows, keycaps).
    private const NOISE_PATTERN = '/[\x{1F000}-\x{1FFFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{2190}-\x{21FF}\x{2300}-\x{23FF}\x{FE0F}\x{200D}\x{20E3}\x{2022}\x{25AA}-\x{25FE}]/u';

    /**
     * @return array<int, array{
     *     raw_line: string,
     *     product_name: ?string,
     *     specs_text: ?string,
     *     spec_ram: ?string,
     *     spec_storage: ?string,
     *     spec_cpu: ?string,
     *     price: ?float,
     *     currency: ?string,
     *     quantity_note: ?string,
     *     parse_confidence: 'high'|'medium'|'low'
     * }>
     */
    public function parse(string $rawText): array
    {
        try {
            $normalized = str_replace(["\r\n", "\r"], "\n", $rawText);
            $normalized = $this->stripNoise($normalized);
            $normalized = trim($normalized);

            if ($normalized === '') {
                return [];
            }

            $lines = array_values(array_filter(
                array_map('trim', explode("\n", $normalized)),
                fn ($line) => $line !== '' && !$this->isDecorativeLine($line)
            ));

            if (empty($lines)) {
                return [];
            }

            $blocks = $this->decideBlocks($normalized, $lines);

            $rows = [];
            foreach ($blocks as $block) {
                $rows[] = $this->parseBlock($block);
            }

            return $rows;
        } catch (\Throwable $e) {
            return [[
                'raw_line' => $rawText,
                'product_name' => null,
                'specs_text' => null,
                'spec_ram' => null,
                'spec_storage' => null,
                'spec_cpu' => null,
                'price' => null,
                'currency' => null,
                'quantity_note' => null,
                'parse_confidence' => 'low',
            ]];
        }
    }

    /**
     * @param string[] $lines
     * @return string[] one block of text per product
     */
    private function decideBlocks(string $normalized, array $lines): array
    {
        $everyLineHasPrice = true;
        foreach ($lines as $line) {
            if (!$this->lineHasPrice($line)) {
                $everyLineHasPrice = false;
                break;
            }
        }

        if ($everyLineHasPrice) {
            return $lines;
        }

        // Not every line has a price on its own — fall back to blank-line
        // separated multi-line blocks (a product's spec details often wrap
        // across several lines with the price on its own line or absent).
        $rawBlocks = preg_split('/\n\s*\n/', $normalized);
        $blocks = [];
        foreach ($rawBlocks as $rawBlock) {
            $blockLines = array_values(array_filter(
                array_map('trim', explode("\n", $rawBlock)),
                fn ($line) => $line !== '' && !$this->isDecorativeLine($line)
            ));
            if (!empty($blockLines)) {
                $blocks[] = implode("\n", $blockLines);
            }
        }

        return empty($blocks) ? [implode("\n", $lines)] : $blocks;
    }

    /**
     * Strip emoji, pictographic symbols, and WhatsApp text-formatting
     * markers (*bold*, _italic_, ~strike~) that regularly show up in
     * supplier broadcast pastes but carry no product information — leaving
     * them in place breaks the price/spec/CPU regexes below.
     */
    private function stripNoise(string $text): string
    {
        $text = preg_replace(self::NOISE_PATTERN, '', $text) ?? $text;
        $text = str_replace(['*', '_', '~'], '', $text);
        return $text;
    }

    /**
     * After stripNoise() removes emoji, decorative separator lines (made up
     * of only punctuation/symbols, e.g. "------", "====", leftover bullets)
     * collapse to junk with no letters or digits. Drop those entirely
     * rather than let them become bogus low-confidence rows.
     */
    private function isDecorativeLine(string $line): bool
    {
        return !preg_match('/[\p{L}\p{N}]/u', $line);
    }

    private function lineHasPrice(string $line): bool
    {
        foreach (array_keys(self::PRICE_PATTERNS) as $pattern) {
            if (preg_match($pattern, $line)) {
                return true;
            }
        }
        return false;
    }

    private function parseBlock(string $block): array
    {
        $rawLine = $block;

        [$price, $currency, $remainderAfterPrice] = $this->extractPrice($block);

        // Determine the product name up front when it's a clean first line
        // of a multi-line block, and strip it out of the text handed to
        // extractSpecs() — otherwise the name (e.g. "Dell Latitude 5440")
        // leaks into specs_text alongside the real leftover spec tokens.
        $lines = array_values(array_filter(
            array_map('trim', explode("\n", $block)),
            fn ($line) => $line !== ''
        ));
        $productName = null;
        $specsInput = $remainderAfterPrice;
        if (count($lines) > 1) {
            $first = $lines[0];
            if (!$this->lineHasPrice($first) && !$this->looksLikePureSpecLine($first)) {
                $productName = $this->cleanName($first);
                $specsInput = trim(str_ireplace($first, ' ', $specsInput));
            }
        }

        $specs = $this->extractSpecs($specsInput);

        if ($productName === null || $productName === '') {
            $productName = $this->extractProductName($block, $remainderAfterPrice, $specs);
        }

        $confidence = $this->decideConfidence($price, $specs);

        return [
            'raw_line' => $rawLine !== '' ? $rawLine : $block,
            'product_name' => $productName,
            'specs_text' => $specs['specs_text'],
            'spec_ram' => $specs['spec_ram'],
            'spec_storage' => $specs['spec_storage'],
            'spec_cpu' => $specs['spec_cpu'],
            'price' => $price,
            'currency' => $currency,
            'quantity_note' => null,
            'parse_confidence' => $confidence,
        ];
    }

    /**
     * @return array{0: ?float, 1: ?string, 2: string} [price, currency, remainder text with the matched price substring removed]
     */
    private function extractPrice(string $text): array
    {
        foreach (self::PRICE_PATTERNS as $pattern => $currency) {
            if (preg_match($pattern, $text, $m)) {
                $price = (float) str_replace(',', '', $m[1]);
                $remainder = trim(str_replace($m[0], ' ', $text));
                return [$price, $currency, $remainder];
            }
        }

        return [null, null, $text];
    }

    /**
     * @return array{spec_ram: ?string, spec_storage: ?string, spec_cpu: ?string, specs_text: ?string}
     */
    private function extractSpecs(string $text): array
    {
        $remainder = $text;
        $specRam = null;
        $specStorage = null;
        $specCpu = null;

        // RAM/Storage combo (e.g. "16/512") must be checked before the
        // separate explicit-storage regex below, otherwise the storage half
        // of the combo would be consumed first by the standalone "###GB"
        // pattern and the combo would never match as a pair.
        if (preg_match('/\b(\d{1,3})\s?\/\s?(\d{2,4})\b/', $remainder, $m)) {
            $specRam = $m[1] . 'GB';
            $specStorage = $m[2] . 'GB';
            $remainder = trim(str_replace($m[0], ' ', $remainder));
        }

        if ($specRam === null && preg_match('/(\d{1,3})\s?GB\s?RAM/i', $remainder, $m)) {
            $specRam = $m[1] . 'GB';
            $remainder = trim(str_replace($m[0], ' ', $remainder));
        }

        if ($specStorage === null && preg_match('/(\d{2,4})\s?GB\s?(?:Storage|ROM|SSD)\b/i', $remainder, $m)) {
            $specStorage = $m[1] . 'GB';
            $remainder = trim(str_ireplace($m[0], ' ', $remainder));
        }

        // Any remaining bare "NNGB" tokens (no RAM/Storage keyword attached)
        // are ambiguous individually. With exactly two left — the common
        // shape for multi-line blocks like "16GB\n512GB" — assume the
        // smaller is RAM and the larger is storage, since real-world RAM
        // capacities (4-64GB) are reliably smaller than storage (128GB+).
        // With exactly one left, default it to storage (matches prior
        // behavior for a single bare "256GB"-style token).
        if ($specRam === null || $specStorage === null) {
            preg_match_all('/\b(\d{1,4})\s?GB\b/i', $remainder, $bareMatches);
            $bareValues = array_map('intval', $bareMatches[1]);

            if ($specRam === null && $specStorage === null && count($bareValues) >= 2) {
                sort($bareValues);
                $specRam = $bareValues[0] . 'GB';
                $specStorage = end($bareValues) . 'GB';
                $remainder = trim(preg_replace('/\b\d{1,4}\s?GB\b/i', ' ', $remainder));
            } elseif ($specStorage === null && count($bareValues) >= 1) {
                $specStorage = $bareValues[0] . 'GB';
                $remainder = trim(preg_replace('/\b\d{1,4}\s?GB\b/i', ' ', $remainder, 1));
            }
        }

        foreach (self::CPU_PATTERNS as $pattern) {
            if (preg_match($pattern, $remainder, $m)) {
                $specCpu = trim($m[0]);
                $remainder = trim(str_replace($m[0], ' ', $remainder));
                break;
            }
        }

        $specsText = trim(preg_replace('/\s+/', ' ', $remainder));
        if ($specsText === '') {
            $specsText = null;
        } else {
            // Same unbounded-length risk as product_name (see there) — cap
            // to fit sb_products.specs_text (string(500)).
            $specsText = mb_substr($specsText, 0, 500);
        }

        return [
            'spec_ram' => $specRam,
            'spec_storage' => $specStorage,
            'spec_cpu' => $specCpu,
            'specs_text' => $specsText,
        ];
    }

    private function extractProductName(string $block, string $remainderAfterPrice, array $specs): ?string
    {
        $lines = array_values(array_filter(
            array_map('trim', explode("\n", $block)),
            fn ($line) => $line !== ''
        ));

        if (count($lines) > 1) {
            $first = $lines[0];
            if (!$this->lineHasPrice($first) && !$this->looksLikePureSpecLine($first)) {
                return $this->cleanName($first);
            }
            // First line looked like price/spec only — fall through to the
            // generic single-line strategy on the whole block.
        }

        // Single-line block (or multi-line whose first line is unusable):
        // take the text before the first recognized token (price or spec).
        $name = trim(preg_replace('/\s+/', ' ', $remainderAfterPrice));

        // Strip out spec substrings we already extracted so they don't
        // linger inside the "name" portion.
        foreach ([$specs['spec_cpu']] as $token) {
            if ($token) {
                $name = trim(str_ireplace($token, '', $name));
            }
        }

        // Cut at the first digit-heavy token (likely a spec) to approximate
        // "text before the first recognized token".
        if (preg_match('/^(.*?)(?=\d{1,4}\s?(?:GB|\/|RAM|Storage|ROM|SSD)|$)/i', $name, $m)) {
            $candidate = $this->cleanName($m[1]);
            if ($candidate !== '') {
                $name = $candidate;
            }
        }

        $name = $this->cleanName($name);

        if ($name === '') {
            $fallback = trim(preg_replace('/\s+/', ' ', $block));
            $name = mb_substr($fallback, 0, 60);
        }

        // When a paste has no blank lines between products and no recognized
        // spec keyword (GB/RAM/Storage/etc.) anywhere, the regex above can
        // fall through to matching almost the entire block as the "name" —
        // cap it so it always fits the sb_products.product_name column
        // (string()/VARCHAR(255)) instead of throwing a DB error and
        // aborting the whole broadcast import.
        $name = mb_substr($name, 0, 255);

        return $name !== '' ? $name : null;
    }

    private function looksLikePureSpecLine(string $line): bool
    {
        if ($this->lineHasPrice($line)) {
            return true;
        }
        if (preg_match('/^[\d\s\/GBgbRAMramSSDssdROMrom.,:-]+$/', $line)) {
            return true;
        }
        return false;
    }

    private function cleanName(string $name): string
    {
        $name = trim($name);
        $name = trim($name, " \t\n\r\0\x0B-:|,.");
        return trim($name);
    }

    /**
     * @param array{spec_ram: ?string, spec_storage: ?string, spec_cpu: ?string, specs_text: ?string} $specs
     */
    private function decideConfidence(?float $price, array $specs): string
    {
        $hasSpec = $specs['spec_ram'] !== null || $specs['spec_storage'] !== null || $specs['spec_cpu'] !== null;
        $hasPrice = $price !== null;

        if ($hasPrice && $hasSpec) {
            return 'high';
        }

        if ($hasPrice || $hasSpec) {
            return 'medium';
        }

        return 'low';
    }
}
