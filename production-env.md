APP_NAME="Zeronix Portal"
APP_ENV=production
APP_KEY=base64:3p8G1L9C4X2J5K8M7N6P9Q3R4T8V2W5Y=
APP_DEBUG=false
APP_URL=https://zeronixtech.com/api
FRONTEND_URL=https://zeronixtech.com

LOG_CHANNEL=stack
LOG_LEVEL=error

# Hostinger Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u703200280_zeronix_portal
DB_USERNAME=u703200280_zeronix_portal
DB_PASSWORD="375RRe7rXD!e5bc"

# Session & Cache (File cache is best for shared hosting)
BROADCAST_CONNECTION=pusher
CACHE_STORE=file
QUEUE_CONNECTION=database
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

# JWT Auth
JWT_SECRET=b7d3a8e9f2c5h6k4m9n2p5q8r3t7v1w4

# Pusher Credentials (WebSockets)
PUSHER_APP_ID="2146763"
PUSHER_APP_KEY="7935b3acb687b8f722ad"
PUSHER_APP_SECRET="066b9eefa104e1b58a4a"
PUSHER_APP_CLUSTER="ap2"

# Hostinger SMTP Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME="info@zeronix.ae"
MAIL_PASSWORD="Qj2]tG7bmmf?"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="info@zeronix.ae"
MAIL_FROM_NAME="${APP_NAME}"
