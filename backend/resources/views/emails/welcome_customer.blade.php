<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .credentials { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Zeronix Portal</h1>
        </div>
        <p>Hello {{ $customer->name }},</p>
        <p>Your account has been successfully registered on the Zeronix Customer Portal. You can now login to view your quotes, invoices, and browse our product catalog.</p>
        
        <div class="credentials">
            <p><strong>Login URL:</strong> <a href="{{ config('app.frontend_url') }}/portal/login">{{ config('app.frontend_url') }}/portal/login</a></p>
            <p><strong>Email:</strong> {{ $customer->email }}</p>
            <p><strong>Temporary Password:</strong> {{ $password }}</p>
        </div>

        <p>For security reasons, we recommend that you change your password after your first login.</p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="{{ config('app.frontend_url') }}/portal/login" class="btn">Login to Portal</a>
        </div>

        <p>If you have any questions, feel free to reply to this email.</p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Zeronix Financial Portal. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
