<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$quote = App\Models\Quote::first();
$controller = app(App\Http\Controllers\DocumentController::class);

// Access the protected renderPdfHtml method using reflection
$method = new ReflectionMethod('App\Http\Controllers\DocumentController', 'renderPdfHtml');
$method->setAccessible(true);

$template = App\Models\Template::where('type', 'quote')->first();
$html = $method->invoke($controller, $template->content, $quote, 'quote');

if (strpos($html, 'img src="C:/') !== false) {
    echo "SUCCESS: Found absolute image path!\n";
} else if (strpos($html, '<h2') !== false) {
    echo "FAILED: Found text fallback (h2).\n";
} else {
    echo "UNKNOWN: " . substr($html, 0, 500) . "\n";
}
