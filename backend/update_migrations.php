<?php
$dir = __DIR__ . '/database/migrations';
$files = scandir($dir);

$schemas = [
    'create_users_table' => function($content) {
        return preg_replace("/\\\$table->string\('password'\);/", "\$table->string('password');\n            \$table->string('role')->default('admin');", $content);
    },
    'create_customers_table' => "\$table->id();\n            \$table->string('name');\n            \$table->string('company')->nullable();\n            \$table->string('email')->unique();\n            \$table->string('phone')->nullable();\n            \$table->string('password');\n            \$table->timestamps();",
    'create_suppliers_table' => "\$table->id();\n            \$table->string('name');\n            \$table->string('contact_person')->nullable();\n            \$table->string('email')->unique();\n            \$table->string('phone')->nullable();\n            \$table->string('website')->nullable();\n            \$table->text('address')->nullable();\n            \$table->timestamps();",
    'create_brands_table' => "\$table->id();\n            \$table->string('name');\n            \$table->string('logo')->nullable();\n            \$table->timestamps();",
    'create_categories_table' => "\$table->id();\n            \$table->string('name');\n            \$table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();\n            \$table->timestamps();",
    'create_supplier_brands_table' => "\$table->id();\n            \$table->foreignId('supplier_id')->constrained()->cascadeOnDelete();\n            \$table->foreignId('brand_id')->constrained()->cascadeOnDelete();\n            \$table->timestamps();",
    'create_products_table' => "\$table->id();\n            \$table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();\n            \$table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();\n            \$table->string('part_number')->nullable();\n            \$table->string('model_number')->nullable();\n            \$table->string('name');\n            \$table->text('description')->nullable();\n            \$table->json('specs')->nullable();\n            \$table->string('image')->nullable();\n            \$table->timestamps();",
    'create_supplier_products_table' => "\$table->id();\n            \$table->foreignId('supplier_id')->constrained()->cascadeOnDelete();\n            \$table->foreignId('product_id')->constrained()->cascadeOnDelete();\n            \$table->decimal('price', 10, 2)->nullable();\n            \$table->string('currency')->default('AED');\n            \$table->boolean('availability')->default(true);\n            \$table->timestamps();",
    'create_enquiries_table' => "\$table->id();\n            \$table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();\n            \$table->string('source')->default('portal');\n            \$table->string('priority')->default('normal');\n            \$table->string('status')->default('new');\n            \$table->text('notes')->nullable();\n            \$table->timestamps();",
    'create_enquiry_items_table' => "\$table->id();\n            \$table->foreignId('enquiry_id')->constrained()->cascadeOnDelete();\n            \$table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();\n            \$table->integer('quantity')->default(1);\n            \$table->text('description')->nullable();\n            \$table->timestamps();",
    'create_quotes_table' => "\$table->id();\n            \$table->foreignId('enquiry_id')->nullable()->constrained()->nullOnDelete();\n            \$table->foreignId('customer_id')->constrained()->cascadeOnDelete();\n            \$table->decimal('subtotal', 10, 2)->default(0);\n            \$table->decimal('vat', 10, 2)->default(0);\n            \$table->decimal('total', 10, 2)->default(0);\n            \$table->string('status')->default('draft');\n            \$table->timestamps();",
    'create_quote_items_table' => "\$table->id();\n            \$table->foreignId('quote_id')->constrained()->cascadeOnDelete();\n            \$table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();\n            \$table->integer('quantity')->default(1);\n            \$table->decimal('unit_price', 10, 2)->default(0);\n            \$table->decimal('total', 10, 2)->default(0);\n            \$table->timestamps();",
    'create_invoices_table' => "\$table->id();\n            \$table->foreignId('quote_id')->nullable()->constrained()->nullOnDelete();\n            \$table->foreignId('customer_id')->constrained()->cascadeOnDelete();\n            \$table->decimal('subtotal', 10, 2)->default(0);\n            \$table->decimal('vat', 10, 2)->default(0);\n            \$table->decimal('total', 10, 2)->default(0);\n            \$table->string('status')->default('pending');\n            \$table->timestamps();",
    'create_invoice_items_table' => "\$table->id();\n            \$table->foreignId('invoice_id')->constrained()->cascadeOnDelete();\n            \$table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();\n            \$table->integer('quantity')->default(1);\n            \$table->decimal('unit_price', 10, 2)->default(0);\n            \$table->decimal('total', 10, 2)->default(0);\n            \$table->timestamps();",
    'create_chat_conversations_table' => "\$table->id();\n            \$table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();\n            \$table->string('subject')->nullable();\n            \$table->string('status')->default('open');\n            \$table->timestamps();",
    'create_chat_messages_table' => "\$table->id();\n            \$table->foreignId('chat_conversation_id')->constrained()->cascadeOnDelete();\n            \$table->string('sender_type');\n            \$table->unsignedBigInteger('sender_id')->nullable();\n            \$table->text('message');\n            \$table->boolean('is_read')->default(false);\n            \$table->timestamps();",
    'create_supplier_broadcasts_table' => "\$table->id();\n            \$table->foreignId('supplier_id')->constrained()->cascadeOnDelete();\n            \$table->text('message');\n            \$table->timestamps();",
];

foreach ($files as $file) {
    if (strpos($file, '.php') === false) continue;
    $content = file_get_contents($dir . '/' . $file);
    
    foreach ($schemas as $key => $schema) {
        if (strpos($file, $key) !== false) {
            if (is_callable($schema)) {
                $content = $schema($content);
            } else {
                $content = preg_replace("/\\\$table->id\(\);\n.*\\\$table->timestamps\(\);/s", $schema, $content);
            }
            file_put_contents($dir . '/' . $file, $content);
        }
    }
}
