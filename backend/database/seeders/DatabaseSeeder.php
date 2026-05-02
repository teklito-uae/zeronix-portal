<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@zeronix.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Production Suppliers
        $this->call(ProductionSupplierSeeder::class);
    }
}
