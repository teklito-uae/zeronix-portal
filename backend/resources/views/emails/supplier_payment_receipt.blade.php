<x-mail::message>
{!! nl2br(e($customBody ?? "Dear Supplier,\n\nPlease find attached the payment receipt for your records.\n\nThank you for your continued partnership.")) !!}

Thanks,<br>
{{ config('app.name') }} Team
</x-mail::message>
