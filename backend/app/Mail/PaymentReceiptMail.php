<?php

namespace App\Mail;

use App\Models\PaymentReceipt;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public $receipt;
    public $pdfContent;
    public $filename;
    public $customSubject;
    public $customBody;

    /**
     * Create a new message instance.
     */
    public function __construct(PaymentReceipt $receipt, $pdfContent, $filename, $subject = null, $body = null)
    {
        $this->receipt = $receipt;
        $this->pdfContent = $pdfContent;
        $this->filename = $filename;
        $this->customSubject = $subject;
        $this->customBody = $body;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?? "Payment Receipt #{$this->receipt->receipt_number} from Zeronix",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment_receipt',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, $this->filename)
                ->withMime('application/pdf'),
        ];
    }
}
