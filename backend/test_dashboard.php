<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'staff1@zeronix.com')->first();
try {
    $request = Illuminate\Http\Request::create('/api/admin/dashboard', 'GET');
    $request->setUserResolver(function () use ($user) { return $user; });
    $controller = app(App\Http\Controllers\DashboardController::class);
    $response = $controller->index($request, app(App\Services\DashboardService::class));
    echo json_encode($response->getData(true));
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
