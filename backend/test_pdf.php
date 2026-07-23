<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $quote = App\Models\Quote::first();
    $controller = app(App\Http\Controllers\DocumentController::class);
    $response = $controller->downloadQuote($quote->id);
    
    if (method_exists($response, 'getContent')) {
        file_put_contents('test.pdf', $response->getContent());
        echo "PDF saved to test.pdf\n";
    } else {
        echo "Response has no getContent method: " . get_class($response) . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
}
