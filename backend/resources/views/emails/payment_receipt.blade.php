<x-mail::message>
{!! nl2br(e($customBody ?? "Dear Customer,\n\nPlease find attached the payment receipt for your records.\n\nThank you for your payment.")) !!}

Thanks,<br>
{{ config('app.name') }} Team
</x-mail::message>
