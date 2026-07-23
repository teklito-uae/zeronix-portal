<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$settings = App\Models\Company::first()->settings;
$relativePath = str_replace('/storage/', '', $settings['logo_path']);
$path = storage_path('app/public/' . $relativePath);
$path = str_replace('\\', '/', $path);
echo "Resolved path: " . $path . "\n";
echo "Exists? " . (file_exists($path) ? 'Yes' : 'No') . "\n";
