<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1f2937;
            font-size: 14px;
            line-height: 1.7;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .email-wrap {
            max-width: 600px;
            margin: 0 auto;
            padding: 24px 8px;
        }

        .message {
            white-space: pre-wrap;
        }

        .signature {
            margin-top: 28px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }

        .sig-name {
            font-weight: 700;
            font-size: 14px;
            color: #111827;
        }

        .sig-role {
            font-size: 13px;
            color: #4b5563;
            margin-top: 2px;
        }

        .sig-company {
            font-size: 13px;
            font-weight: 600;
            margin-top: 8px;
            color: {{ $brandColor }};
        }

        .sig-contact {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }

        .sig-logo {
            display: block;
            max-height: 42px;
            max-width: 200px;
            margin-top: 12px;
        }

        .footer {
            margin-top: 28px;
            font-size: 11px;
            color: #9ca3af;
        }
    </style>
</head>

<body>
    <div class="email-wrap">
        <div class="message">Dear {{ $quote->customer->name ?? 'Customer' }},<br><br>{!! nl2br(e($emailBody)) !!}</div>

        <div class="signature">
            <div class="sig-name">{{ $sender->name ?? $companyName }}</div>
            @if(!empty($sender->designation))
            <div class="sig-role">{{ $sender->designation }}</div>
            @endif
            <div class="sig-company">{{ $companyName }}</div>
            @if(!empty($sender->phone) || !empty($sender->email))
            <div class="sig-contact">
                @if(!empty($sender->phone)){{ $sender->phone }}@endif
                @if(!empty($sender->phone) && !empty($sender->email))&nbsp;&nbsp;|&nbsp;&nbsp;@endif
                @if(!empty($sender->email)){{ $sender->email }}@endif
            </div>
            @endif
            @if($logoUrl)
            <img src="{{ $logoUrl }}" alt="{{ $companyName }}" class="sig-logo">
            @endif
        </div>

        @if($companyAddress)
        <div class="footer">{{ $companyAddress }}</div>
        @endif
    </div>
</body>

</html>
