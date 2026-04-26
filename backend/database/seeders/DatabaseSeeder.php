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

        // 2. Default Brands
        $brandNames = ['Cisco', 'Dell', 'HP', 'Lenovo', 'Fortinet', 'Asus', 'Gigabyte'];
        foreach ($brandNames as $name) {
            Brand::create(['name' => $name]);
        }

        // 3. Essential Categories
        $categories = [
            ['name' => 'Networking', 'children' => ['Switches', 'Routers', 'Access Points', 'Firewalls']],
            ['name' => 'Servers', 'children' => ['Rack Servers', 'Tower Servers', 'Storage (NAS/SAN)']],
            ['name' => 'Laptops', 'children' => ['Gaming Laptops', 'Business Laptops', 'Workstations']],
            ['name' => 'Surveillance', 'children' => ['IP Cameras', 'NVR/DVR', 'Video Management']],
            ['name' => 'IT Accessories', 'children' => ['Monitors', 'Peripherals', 'Cables']],
        ];

        foreach ($categories as $cat) {
            $parent = Category::create(['name' => $cat['name']]);
            foreach ($cat['children'] as $child) {
                Category::create(['name' => $child, 'parent_id' => $parent->id]);
            }
        }
    }
}
