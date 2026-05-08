# TODO - Fix CORS Login Error

## Step 1: Verify current CORS wiring
- [ ] Confirm `backend/config/cors.php` is not currently being applied (no HandleCors/fruitcake/laravel-cors).

## Step 2: Implement native CORS middleware
- [ ] Create `backend/app/Http/Middleware/HandleCors.php` that reads config/cors.php and sets CORS headers.
- [ ] Ensure middleware handles `OPTIONS` preflight for `api/*` and returns 204.

## Step 3: Register middleware for API routes
- [ ] Update `backend/bootstrap/app.php` to apply middleware to API requests.

## Step 4: Update allowed origins
- [ ] Add the frontend origin(s) (including domain/IP + port) into `backend/config/cors.php` or via `CORS_ALLOWED_ORIGINS`.

## Step 5: Test
- [ ] Restart backend.
- [ ] Re-test login and verify browser no longer blocks CORS.
- [ ] Confirm preflight `OPTIONS` returns 204 with required headers.


