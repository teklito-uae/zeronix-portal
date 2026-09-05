<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invoice;
    public $pdfContent;
    public $filename;
    public $customSubject;
    public $emailBody;
    public $sender;

    /**
     * Create a new message instance.
     */
    public function __construct(Invoice $invoice, $pdfContent, $filename, $subject = null, $body = null, ?User $sender = null)
    {
        $this->invoice = $invoice;
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
        $companyName = $this->invoice->company->settings['company_name']
            ?? ($this->invoice->company->name ?? 'Zeronix Portal');

        return new Envelope(
            subject: $this->customSubject ?? "Invoice from {$companyName}: {$this->invoice->invoice_number}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $settings = $this->invoice->company->settings ?? [];

        $logoUrl = null;
        if (!empty($settings['logo_path'])) {
            $logoUrl = rtrim(config('app.url'), '/') . $settings['logo_path'];
        }

        return new Content(
            view: 'emails.invoice',
            with: [
                'companyName' => $settings['company_name'] ?? ($this->invoice->company->name ?? 'Our Company'),
                'companyAddress' => $settings['company_address'] ?? ($this->invoice->company->address ?? ''),
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
