import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Send } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. `/admin/marketing/templates/12/test-send` */
  endpoint: string;
}

export const TestSendDialog = ({ open, onOpenChange, endpoint }: TestSendDialogProps) => {
  const admin = useAuthStore((s) => s.admin);
  const [to, setTo] = useState(admin?.email || '');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!to) return;
    setSending(true);
    try {
      const res = await api.post(endpoint, { to });
      toast.success(res.data.message || 'Test email sent');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Send Test Email</DialogTitle>
          <DialogDescription className="text-[12px]">
            The email is rendered with sample data and sent via your marketing SMTP pool with a [TEST] subject prefix.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[12px]">Send to</Label>
          <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@company.com" className="h-9 text-[13px]" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[13px]">Cancel</Button>
          <Button onClick={send} disabled={sending || !to} className="text-[13px] gap-1.5 bg-brand-primary">
            <Send size={13} />
            {sending ? 'Sending…' : 'Send Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
