<?php

return [
    // Prefixes used for the API endpoints. Both admin and staff share the same resource controllers.
    'prefixes' => [
        'admin' => 'admin',
        'staff' => 'staff',
    ],

    // Default pagination size for API list endpoints.
    'default_per_page' => 15,
];
