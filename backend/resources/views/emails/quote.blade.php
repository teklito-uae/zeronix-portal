<x-mail::message>
{!! nl2br(e($emailBody)) !!}

Thanks,<br>
{{ config('app.name') }} Team
</x-mail::message>
