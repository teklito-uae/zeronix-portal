<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class MarketingCampaignMail extends Mailable
{
    use Queueable, SerializesModels;

    public $emailSubject;
    public $htmlBody;
    public $unsubscribeUrl;

    public function __construct(string $subject, string $htmlBody, ?string $unsubscribeUrl = null)
    {
        $this->emailSubject = $subject;
        $this->htmlBody = $htmlBody;
        $this->unsubscribeUrl = $unsubscribeUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->emailSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->htmlBody,
        );
    }

    public function headers(): Headers
    {
        $headers = [];
        if ($this->unsubscribeUrl) {
            $headers['List-Unsubscribe'] = '<' . $this->unsubscribeUrl . '>';
            $headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
        }

        return new Headers(text: $headers);
    }
}
