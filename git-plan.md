# TRIGGER
on:
  push:
    branches: [master]

# STEPS IN ORDER:

# 1. Checkout code

# 2. Setup Node 22
#    - Run: cd frontend && npm install && npm run build
#    - Output: frontend/dist/

# 3. Setup PHP 8.3
#    - Extensions: pdo_mysql, mbstring, zip
#    - Run: cd backend && composer install --no-dev --optimize-autoloader
#    - Run: php artisan config:cache && route:cache && view:cache

# 4. Prepare deploy/ folder
#    - Copy frontend/dist/* → deploy/
#    - Copy backend/ → deploy/backend/

# 5. Inject .env
#    - echo "${{ secrets.PRODUCTION_ENV }}" > deploy/backend/.env

# 6. Create root deploy/.htaccess
#    - /api/* → routes to backend/public/index.php
#    - everything else → index.html (React SPA)

# 7. Create Laravel storage folders
#    - deploy/backend/storage/app/public
#    - deploy/backend/storage/framework/cache
#    - deploy/backend/storage/framework/sessions
#    - deploy/backend/storage/framework/views
#    - deploy/backend/storage/logs
#    - Set permissions 775

# 8. Remove all .gitignore files inside deploy/

# 9. Deploy to production branch
#    - Use: JamesIves/github-pages-deploy-action
#    - folder: deploy
#    - branch: production
#    - clean: true
#    - single-commit: true

# HOSTINGER SETUP (do once manually):
# - Point Hostinger Git deployment to production branch
# - Set document root to public_html
# - deploy/ contents land directly in public_html/