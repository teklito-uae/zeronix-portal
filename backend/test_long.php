<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$quote = App\Models\Quote::first();
if (!$quote) die("No quote found");

$quote->subtotal = 4000;
$quote->vat_amount = 200;
$quote->total = 4200;
$quote->save();

$controller = app(App\Http\Controllers\DocumentController::class);
$response = $controller->downloadQuote($quote->id);

file_put_contents('test_long.pdf', $response->getContent());
echo "Saved test_long.pdf with 40 items.\n";
