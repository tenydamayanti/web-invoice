<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $config = config('cors', []);
        $paths = Arr::wrap($config['paths'] ?? ['*']);

        // Only apply CORS for matching paths.
        if (! $this->pathMatches($request->path(), $paths)) {
            return $next($request);
        }

        $origin = $request->headers->get('Origin');
        if ($origin) {
            $allowed = $this->isOriginAllowed($origin, $config);

            if ($allowed) {
                $this->setCorsHeaders($request, $origin);

                // Preflight
                if ($request->isMethod('OPTIONS')) {
                    /** @var Response $response */
                    $response = response('', 204);
                    $this->setCorsHeaders($request, $origin, $response);
                    return $response;
                }
            }
        }

        /** @var Response $response */
        $response = $next($request);
        if ($origin) {
            // Apply headers on actual requests as well (only when origin is allowed)
            $allowedOrigins = Arr::wrap($config['allowed_origins'] ?? []);
            $allowedOriginPatterns = Arr::wrap($config['allowed_origins_patterns'] ?? []);

            $allowed = in_array($origin, $allowedOrigins, true);
            if (! $allowed) {
                foreach ($allowedOriginPatterns as $pattern) {
                    if (@preg_match($pattern, $origin) === 1) {
                        $allowed = true;
                        break;
                    }
                }
            }

            if ($allowed) {
                $this->setCorsHeaders($request, $origin, $response);
            }
        }

        return $response;
    }

    private function pathMatches(string $requestPath, array $paths): bool
    {
        foreach ($paths as $path) {
            // config/cors.php uses values like: api/*
            $path = trim($path);
            if ($path === '' || $path === '*') {
                return true;
            }

            if (str_ends_with($path, '/*')) {
                $prefix = substr($path, 0, -2);
                if (str_starts_with($requestPath, $prefix)) {
                    return true;
                }
            }

            if ($path === $requestPath) {
                return true;
            }
        }

        return false;
    }

    private function isOriginAllowed(string $origin, array $config): bool
    {
        $allowedOrigins = Arr::wrap($config['allowed_origins'] ?? []);
        $allowedOriginPatterns = Arr::wrap($config['allowed_origins_patterns'] ?? []);

        if (in_array($origin, $allowedOrigins, true)) {
            return true;
        }

        foreach ($allowedOriginPatterns as $pattern) {
            if (@preg_match($pattern, $origin) === 1) {
                return true;
            }
        }

        return false;
    }

    private function setCorsHeaders(Request $request, string $origin, ?Response $response = null): void
    {
        $config = config('cors', []);


        $headers = [
            'Access-Control-Allow-Origin' => $origin,
            'Vary' => 'Origin',
        ];

        $allowedMethods = Arr::wrap($config['allowed_methods'] ?? ['*']);
        if (in_array('*', $allowedMethods, true)) {
            $headers['Access-Control-Allow-Methods'] = $request->headers->get('Access-Control-Request-Method', '*');
        } else {
            $headers['Access-Control-Allow-Methods'] = implode(', ', $allowedMethods);
        }

        $allowedHeaders = Arr::wrap($config['allowed_headers'] ?? ['*']);
        if (in_array('*', $allowedHeaders, true)) {
            $headers['Access-Control-Allow-Headers'] = $request->headers->get('Access-Control-Request-Headers', '*');
        } else {
            $headers['Access-Control-Allow-Headers'] = implode(', ', $allowedHeaders);
        }

        if ((bool) ($config['supports_credentials'] ?? false)) {
            $headers['Access-Control-Allow-Credentials'] = 'true';
        }

        $maxAge = $config['max_age'] ?? 0;
        if ((int) $maxAge > 0) {
            $headers['Access-Control-Max-Age'] = (string) $maxAge;
        }

        // Set on response headers
        if ($response) {
            foreach ($headers as $k => $v) {
                $response->headers->set($k, $v, false);
            }

            $exposedHeaders = Arr::wrap($config['exposed_headers'] ?? []);
            if (! empty($exposedHeaders)) {
                $response->headers->set('Access-Control-Expose-Headers', implode(', ', $exposedHeaders), false);
            }

            return;
        }

        // If no response is available, let middleware stack continue.
        // In this codebase, a Response is always available in the current middleware flow.

    }
}

