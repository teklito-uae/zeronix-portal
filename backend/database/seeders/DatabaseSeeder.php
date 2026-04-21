<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@zeronix.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Sample Brands
        $brands = ['Cisco', 'Dell', 'HP', 'Lenovo', 'Fortinet'];
        foreach ($brands as $brand) {
            \App\Models\Brand::create(['name' => $brand]);
        }

        // Sample Categories
        $categories = [
            ['name' => 'Networking', 'children' => ['Switches', 'Routers', 'Access Points']],
            ['name' => 'Servers', 'children' => ['Rack Servers', 'Tower Servers']],
            ['name' => 'Storage', 'children' => ['SAN', 'NAS']],
            ['name' => 'Security', 'children' => ['Firewalls', 'Endpoint Protection']],
        ];

        foreach ($categories as $cat) {
            $parent = \App\Models\Category::create(['name' => $cat['name']]);
            foreach ($cat['children'] as $child) {
                \App\Models\Category::create(['name' => $child, 'parent_id' => $parent->id]);
            }
        }
    }
}
