<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Customer;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Services\MailConfigService;
use Webklex\PHPIMAP\Client;

class SyncCustomerEmails extends Command
{
    protected $signature = 'emails:sync';
    protected $description = 'Sync incoming customer emails via IMAP';

    public function handle()
    {
        $users = User::whereNotNull('imap_host')->get();
        $this->info("Found " . $users->count() . " users with IMAP configured.");

        foreach ($users as $user) {
            $this->info("Syncing emails for: {$user->email}");
            try {
                $client = MailConfigService::getImapClient($user);
                $client->connect();

                $folders = $client->getFolders();
                foreach ($folders as $folder) {
                    // Only sync Inbox for now
                    if (strtolower($folder->name) !== 'inbox') continue;

                    $messages = $folder->query()->unseen()->get();
                    $this->info("Found " . $messages->count() . " unseen messages in {$folder->name}");

                    foreach ($messages as $message) {
                        $senderEmail = $message->getFrom()[0]->mail;
                        $customer = Customer::where('email', $senderEmail)->first();

                        if ($customer) {
                            $this->processCustomerEmail($customer, $message);
                            $message->setFlag('Seen');
                            $this->info("Processed email from: {$senderEmail}");
                        } else {
                            $this->line("Skipping unknown sender: {$senderEmail}");
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("Error syncing for {$user->email}: " . $e->getMessage());
            }
        }
    }

    protected function processCustomerEmail($customer, $message)
    {
        // Find or create conversation
        $conversation = ChatConversation::firstOrCreate(
            ['customer_id' => $customer->id, 'status' => 'open'],
            ['subject' => $message->getSubject() ?? 'Email Inquiry']
        );

        // Store message
        ChatMessage::create([
            'chat_conversation_id' => $conversation->id,
            'sender_type' => 'customer',
            'sender_id' => $customer->id,
            'message' => $message->getHTMLBody() ?: $message->getTextBody(),
            'is_read' => false,
        ]);
    }
}
