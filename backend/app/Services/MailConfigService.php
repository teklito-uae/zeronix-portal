<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class MailConfigService
{
    /**
     * Apply a user's SMTP settings to the mail configuration.
     *
     * @param User $user
     * @return void
     */
    public static function applyUserSmtp(User $user)
    {
        if (!$user->smtp_host) {
            return;
        }

        // Hostinger and others on port 465 often require SSL (SMTPS)
        $encryption = $user->smtp_encryption ?: 'tls';
        $transport = ($user->smtp_port == 465 || $encryption === 'ssl') ? 'smtp' : 'smtp';
        
        $config = [
            'transport' => 'smtp',
            'host' => $user->smtp_host,
            'port' => $user->smtp_port ?? 587,
            'encryption' => $encryption === 'none' ? null : $encryption,
            'username' => $user->smtp_username,
            'password' => $user->smtp_password,
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', 'zeronix.com'), // Use a real domain fallback
        ];

        Config::set('mail.mailers.smtp_user', $config);
        Config::set('mail.default', 'smtp_user');
        
        // Very important: Set the "from" address to match the authenticated user
        Config::set('mail.from.address', $user->smtp_username);
        Config::set('mail.from.name', $user->name);
        
        // Reset the mail manager to apply the new configuration
        app()->forgetInstance('mail.manager');
        Mail::clearResolvedInstances();
    }

    /**
     * Get an IMAP client for the given user.
     *
     * @param User $user
     * @return \Webklex\PHPIMAP\Client
     */
    public static function getImapClient(User $user)
    {
        if (!$user->imap_host) {
            throw new \Exception("IMAP settings not configured for this user.");
        }

        $client = \Webklex\IMAP\Facades\Client::make([
            'host'          => $user->imap_host,
            'port'          => $user->imap_port ?? 993,
            'encryption'    => $user->imap_encryption ?? 'ssl',
            'validate_cert' => true,
            'username'      => $user->imap_username,
            'password'      => $user->imap_password,
            'protocol'      => 'imap'
        ]);

        return $client;
    }
}
