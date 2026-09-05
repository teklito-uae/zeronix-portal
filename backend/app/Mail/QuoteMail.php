<?php

namespace App\Mail;

use App\Models\Quote;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public $quote;
    public $pdfContent;
    public $filename;
    public $customSubject;
    public $emailBody;
    public $sender;

    /**
     * Create a new message instance.
     */
    public function __construct(Quote $quote, $pdfContent, $filename, $subject = null, $body = null, ?User $sender = null)
    {
        $this->quote = $quote;
        $this->pdfContent = $pdfContent;
        $this->filename = $filename;
        $this->customSubject = $subject;
        $this->emailBody = $body;
        $this->sender = $sender;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = $this->quote->company->settings['company_name']
            ?? ($this->quote->company->name ?? 'Zeronix Portal');

        return new Envelope(
            subject: $this->customSubject ?? "Quotation from {$companyName}: {$this->quote->quote_number}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $settings = $this->quote->company->settings ?? [];

        $logoUrl = null;
        if (!empty($settings['logo_path'])) {
            // Unlike the PDF (rendered server-side, so a local file path works),
            // an emailed HTML <img> is fetched by the recipient's mail client
            // over HTTP, so this needs a real absolute URL.
            $logoUrl = rtrim(config('app.url'), '/') . $settings['logo_path'];
        }

        return new Content(
            view: 'emails.quote',
            with: [
                'companyName' => $settings['company_name'] ?? ($this->quote->company->name ?? 'Our Company'),
                'companyAddress' => $settings['company_address'] ?? ($this->quote->company->address ?? ''),
                'brandColor' => $settings['primary_color'] ?? '#0F52BA',
                'logoUrl' => $logoUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, $this->filename)
                ->withMime('application/pdf'),
        ];
    }
}
