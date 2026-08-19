<?php

namespace Tests\Unit\Services;

use App\Services\ContactFileParserService;
use PHPUnit\Framework\TestCase;

class ContactFileParserServiceTest extends TestCase
{
    public function test_parse_vcf_extracts_name_emails_phones_and_organization(): void
    {
        $vcf = <<<VCF
        BEGIN:VCARD
        VERSION:3.0
        FN:John Carter
        ORG:Falcon Trading LLC;Procurement
        EMAIL;TYPE=WORK:john@example.com
        EMAIL;TYPE=HOME:john.home@example.com
        TEL;TYPE=CELL:050-382-1311
        END:VCARD
        VCF;

        $rows = ContactFileParserService::parseVcf($vcf);

        $this->assertCount(1, $rows);
        $this->assertSame('John Carter', $rows[0]['full_name']);
        $this->assertSame('John', $rows[0]['first_name']);
        $this->assertSame('Carter', $rows[0]['last_name']);
        $this->assertSame(['john@example.com', 'john.home@example.com'], $rows[0]['emails']);
        $this->assertSame(['050-382-1311'], $rows[0]['phones']);
        $this->assertSame('Falcon Trading LLC', $rows[0]['organization_name']);
        $this->assertNull($rows[0]['notes']);
    }

    public function test_parse_vcf_handles_multiple_cards_and_skips_cards_without_a_full_name(): void
    {
        $vcf = "BEGIN:VCARD\nFN:Ann Lee\nEND:VCARD\n"
            . "BEGIN:VCARD\nEMAIL:nameless@example.com\nEND:VCARD\n"
            . "BEGIN:VCARD\nFN:Bob\nEND:VCARD\n";

        $rows = ContactFileParserService::parseVcf($vcf);

        $this->assertSame(['Ann Lee', 'Bob'], array_column($rows, 'full_name'));
        $this->assertNull($rows[1]['last_name']);
    }

    public function test_parse_vcf_splits_packed_phone_values_and_deduplicates(): void
    {
        $vcf = "BEGIN:VCARD\nFN:Packed Phones\nTEL:050-382-1311 ::: 050-382-1311 ::: 055-111-2222\nEND:VCARD\n";

        $rows = ContactFileParserService::parseVcf($vcf);

        $this->assertSame(['050-382-1311', '055-111-2222'], $rows[0]['phones']);
    }

    public function test_parse_vcf_decodes_quoted_printable_values(): void
    {
        $vcf = "BEGIN:VCARD\nFN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Caf=C3=A9 Owner\nEND:VCARD\n";

        $rows = ContactFileParserService::parseVcf($vcf);

        $this->assertSame('Café Owner', $rows[0]['full_name']);
    }

    public function test_parse_vcf_returns_empty_array_for_empty_content(): void
    {
        $this->assertSame([], ContactFileParserService::parseVcf(''));
    }

    public function test_parse_csv_handles_google_contacts_style_numbered_columns_and_bom(): void
    {
        $csv = "\xEF\xBB\xBFFirst Name,Middle Name,Last Name,Organization Name,E-mail 1 - Value,E-mail 2 - Value,Phone 1 - Value,Notes\n"
            . "John,Q,Carter,Falcon Trading LLC,john@example.com,john2@example.com,050-382-1311,VIP client\n";

        $rows = ContactFileParserService::parseCsv($csv);

        $this->assertCount(1, $rows);
        $this->assertSame('John Q Carter', $rows[0]['full_name']);
        $this->assertSame('John', $rows[0]['first_name']);
        $this->assertSame('Carter', $rows[0]['last_name']);
        $this->assertSame(['john@example.com', 'john2@example.com'], $rows[0]['emails']);
        $this->assertSame(['050-382-1311'], $rows[0]['phones']);
        $this->assertSame('Falcon Trading LLC', $rows[0]['organization_name']);
        $this->assertSame('VIP client', $rows[0]['notes']);
    }

    public function test_parse_csv_matches_header_aliases_case_insensitively(): void
    {
        $csv = "NAME,Company,Email,Mobile,Remarks\n"
            . "Ann Lee,Zeronix,ann@example.com,0501112222,called back\n";

        $rows = ContactFileParserService::parseCsv($csv);

        $this->assertSame('Ann Lee', $rows[0]['full_name']);
        $this->assertSame('Ann', $rows[0]['first_name']);
        $this->assertSame('Lee', $rows[0]['last_name']);
        $this->assertSame('Zeronix', $rows[0]['organization_name']);
        $this->assertSame(['ann@example.com'], $rows[0]['emails']);
        $this->assertSame(['0501112222'], $rows[0]['phones']);
        $this->assertSame('called back', $rows[0]['notes']);
    }

    public function test_parse_csv_falls_back_to_file_as_then_company_for_the_name(): void
    {
        $csv = "First Name,Last Name,File As,Company\n"
            . ",,Filed Name,Some Co\n"
            . ",,,Company Only LLC\n";

        $rows = ContactFileParserService::parseCsv($csv);

        $this->assertSame(['Filed Name', 'Company Only LLC'], array_column($rows, 'full_name'));
    }

    public function test_parse_csv_skips_rows_without_any_usable_name_and_blank_lines(): void
    {
        $csv = "Name,Email\n"
            . "\n"
            . ",orphan@example.com\n"
            . "Real Person,real@example.com\n";

        $rows = ContactFileParserService::parseCsv($csv);

        $this->assertCount(1, $rows);
        $this->assertSame('Real Person', $rows[0]['full_name']);
    }

    public function test_parse_csv_keeps_quoted_fields_with_embedded_newlines_and_commas(): void
    {
        $csv = "Name,Notes\n"
            . "\"Carter, John\",\"line one\nline two\"\n";

        $rows = ContactFileParserService::parseCsv($csv);

        $this->assertCount(1, $rows);
        $this->assertSame('Carter, John', $rows[0]['full_name']);
        $this->assertSame("line one\nline two", $rows[0]['notes']);
    }

    public function test_parse_csv_returns_empty_array_for_empty_content(): void
    {
        $this->assertSame([], ContactFileParserService::parseCsv(''));
    }

    public function test_parse_json_reads_name_email_and_phone_singular_keys(): void
    {
        $json = json_encode([[
            'name' => 'John Carter',
            'email' => ' john@example.com ',
            'phone' => '050-382-1311 ::: 055-111-2222',
            'company' => 'Falcon Trading LLC',
            'notes' => ' VIP ',
        ]]);

        $rows = ContactFileParserService::parseJson($json);

        $this->assertCount(1, $rows);
        $this->assertSame('John Carter', $rows[0]['full_name']);
        $this->assertSame('John', $rows[0]['first_name']);
        $this->assertSame('Carter', $rows[0]['last_name']);
        $this->assertSame(['john@example.com'], $rows[0]['emails']);
        $this->assertSame(['050-382-1311', '055-111-2222'], $rows[0]['phones']);
        $this->assertSame('Falcon Trading LLC', $rows[0]['organization_name']);
        $this->assertSame('VIP', $rows[0]['notes']);
    }

    public function test_parse_json_prefers_plural_keys_and_explicit_name_parts(): void
    {
        $json = json_encode([[
            'first_name' => 'Ann',
            'last_name' => 'Lee',
            'emails' => [' ann@example.com ', 'ann.work@example.com', 'ann@example.com'],
            'phones' => ['0501112222', '0501112222'],
            'organization_name' => 'Zeronix',
        ]]);

        $rows = ContactFileParserService::parseJson($json);

        $this->assertSame('Ann Lee', $rows[0]['full_name']);
        $this->assertSame('Ann', $rows[0]['first_name']);
        $this->assertSame('Lee', $rows[0]['last_name']);
        $this->assertSame(['ann@example.com', 'ann.work@example.com'], $rows[0]['emails']);
        $this->assertSame(['0501112222'], $rows[0]['phones']);
        $this->assertSame('Zeronix', $rows[0]['organization_name']);
    }

    public function test_parse_json_normalizes_blank_organization_and_notes_to_null(): void
    {
        $json = json_encode([[
            'name' => 'Blank Fields',
            'company' => '   ',
            'notes' => '   ',
        ]]);

        $rows = ContactFileParserService::parseJson($json);

        $this->assertNull($rows[0]['organization_name']);
        $this->assertNull($rows[0]['notes']);
        $this->assertSame([], $rows[0]['emails']);
        $this->assertSame([], $rows[0]['phones']);
    }

    public function test_parse_json_skips_unusable_entries(): void
    {
        $json = json_encode([
            'not-an-array',
            ['email' => 'nameless@example.com'],
            ['name' => 'Kept'],
        ]);

        $rows = ContactFileParserService::parseJson($json);

        $this->assertSame(['Kept'], array_column($rows, 'full_name'));
    }

    public function test_parse_json_returns_empty_array_for_invalid_json(): void
    {
        $this->assertSame([], ContactFileParserService::parseJson('{not json'));
        $this->assertSame([], ContactFileParserService::parseJson('"a string"'));
    }
}
