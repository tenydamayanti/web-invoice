<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware for handling CORS based on config/cors.php
        $middleware->append(
            \App\Http\Middleware\HandleCors::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $exception): bool {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            if ($exception instanceof \Illuminate\Validation\ValidationException) {
                return null;
            }

            $status = method_exists($exception, 'getStatusCode')
                ? $exception->getStatusCode()
                : 500;

            return response()->json([
                'message' => app()->hasDebugModeEnabled()
                    ? $exception->getMessage()
                    : 'Terjadi kesalahan pada server. Periksa log backend untuk detailnya.',
                'error' => class_basename($exception),
            ], $status >= 400 && $status < 600 ? $status : 500);
        });
    })->create();
