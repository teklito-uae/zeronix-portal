<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class ProductionSupplierSeeder extends Seeder
{
    /**
     * Run the database seeds for production suppliers.
     * This ensures all core administrative procurement channels are initialized.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'AL ERSHAD COMPUTERS LLC',
                'email' => 'sales@alershad.com',
                'phone' => '+971 4 358 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'AL RAFA COMPUTER TRADING LLC',
                'email' => 'sales@alrafacomputer.com',
                'phone' => '+971 4 352 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'APPLE WHITE COMPUTERS LLC',
                'email' => 'sales@applewhite.com',
                'phone' => '+971 4 355 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'Cap Computer Trading LLC',
                'email' => 'sales@capcomputer.com',
                'phone' => '+971 4 353 2222',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'GRAND PCD COMPUTER TRADING LLC',
                'email' => 'sales@grandpcd.com',
                'phone' => '+971 4 354 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'IT World Trading LLC',
                'email' => 'sales@itworld.com',
                'phone' => '+971 4 356 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'SIMMAL TECHNOLOGIES LLC',
                'email' => 'sales@simmal.com',
                'phone' => '+971 4 357 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
            [
                'name' => 'SUPERTECH COMPUTER TRADING LLC',
                'email' => 'sales@supertech.com',
                'phone' => '+971 4 353 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ],
        ];

        foreach ($suppliers as $data) {
            Supplier::firstOrCreate(
                ['name' => $data['name']],
                [
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'website' => $data['website'] ?? null,
                    'contact_person' => $data['contact_person'] ?? 'Sales Department',
                ]
            );
        }
    }
}
