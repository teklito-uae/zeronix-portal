<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$file = new Illuminate\Http\UploadedFile(
    __DIR__.'/test.vcf',
    'test.vcf',
    'text/vcard',
    null,
    true // test mode = true (avoids is_uploaded_file check)
);

$request = Illuminate\Http\Request::create(
    '/api/admin/customers/import/preview',
    'POST',
    [],
    [],
    ['file' => $file],
    ['HTTP_ACCEPT' => 'application/json']
);

$user = App\Models\User::first();
$request->setUserResolver(function() use ($user) { return $user; });
$app->instance('request', $request);

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
