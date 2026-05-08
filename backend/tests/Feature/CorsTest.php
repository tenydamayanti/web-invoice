<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsTest extends TestCase
{
    public function test_api_preflight_allows_configured_frontend_origin(): void
    {
        config([
            'cors.allowed_origins' => ['http://34.132.250.111:3000'],
            'cors.allowed_origins_patterns' => [],
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://34.132.250.111:3000',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type, authorization',
        ])->options('/api/auth/login');

        $response->assertNoContent();
        $response->assertHeader('Access-Control-Allow-Origin', 'http://34.132.250.111:3000');
        $response->assertHeader('Access-Control-Allow-Methods', 'POST');
        $response->assertHeader('Access-Control-Allow-Headers', 'content-type, authorization');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }
}
