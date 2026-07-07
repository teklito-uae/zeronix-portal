import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api from '@/lib/axios';
import { Spinner } from '@/components/shared/Spinner';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  bodyHtml: string;
}

/**
 * Renders the template server-side with realistic sample merge data and
 * shows the result in a sandboxed iframe.
 */
export const TemplatePreviewDialog = ({ open, onOpenChange, subject, bodyHtml }: TemplatePreviewDialogProps) => {
  const [rendered, setRendered] = useState<{ subject: string; html: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .post('/admin/marketing/templates/preview', { subject, body_html: bodyHtml })
      .then((res) => setRendered(res.data))
      .catch(() => setRendered({ subject, html: bodyHtml }))
      .finally(() => setLoading(false));
  }, [open, subject, bodyHtml]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Preview</DialogTitle>
          <DialogDescription className="text-[12px]">
            Rendered with sample data. Subject: <span className="font-medium text-brand-primary">{rendered?.subject || subject}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="border border-brand-border rounded-lg overflow-hidden bg-white">
          {loading ? (
            <div className="h-[480px] flex items-center justify-center"><Spinner /></div>
          ) : (
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={rendered?.html || ''}
              className="w-full h-[480px] bg-white"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
