<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; line-height: 1.6; margin: 0; padding: 20px; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border-top: 4px solid #1db14e; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .logo { max-height: 45px; margin-bottom: 25px; }
        .content { margin-top: 20px; font-size: 15px; color: #374151; white-space: pre-wrap; }
        .btn-view { display: inline-block; margin-top: 25px; padding: 12px 24px; background-color: #1db14e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
        .footer { margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center;">
            <img src="{{ config('app.url') }}/images/logo.png" alt="Zeronix Technology" class="logo">
        </div>
        <div class="content">
{!! $emailBody !!}
        </div>
        
        <div class="footer">
            &copy; {{ date('Y') }} Zeronix Technology LLC. All rights reserved.<br>
            Business Bay, Dubai, United Arab Emirates<br>
            <a href="https://zeronixtech.com" style="color: #1db14e; text-decoration: none;">www.zeronixtech.com</a>
        </div>
    </div>
</body>
</html>
