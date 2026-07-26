import { useRef } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Deal, QuoteAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/shared/Spinner';
import { Paperclip, Plus, Download, X } from 'lucide-react';

const storageBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

interface DealAttachmentsSectionProps {
  deal: Deal;
  uploadAttachment: UseMutationResult<Deal, unknown, { id: number | string; formData: FormData }, unknown>;
  removeAttachment: UseMutationResult<Deal, unknown, { id: number | string; index: number }, unknown>;
}

/**
 * File upload/list/remove for a deal. Removal is index-based (matches the
 * existing backend design in Deals.tsx — not an id-based system).
 */
export const DealAttachmentsSection = ({ deal, uploadAttachment, removeAttachment }: DealAttachmentsSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      uploadAttachment.mutate({ id: deal.id, formData });
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1 flex items-center gap-1.5">
          <Paperclip size={13} /> Files
        </Label>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-brand-subtle hover:text-brand-primary rounded-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          {uploadAttachment.isPending ? <Spinner size={14} /> : <Plus size={14} />}
        </Button>
      </div>
      {(deal.attachments ?? []).length === 0 ? (
        <p className="text-[12px] text-brand-subtle text-center py-3">No files attached.</p>
      ) : (
        <ul className="space-y-2">
          {(deal.attachments ?? []).map((att: QuoteAttachment, idx: number) => (
            <li
              key={`${att.path}-${idx}`}
              className="flex items-center justify-between gap-2 bg-brand-surface border border-brand-border/50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip size={13} className="text-brand-subtle flex-shrink-0" />
                <span className="text-[12px] text-brand-primary truncate">{att.name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`${storageBaseUrl}/storage/${att.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-subtle hover:text-brand-primary p-1"
                >
                  <Download size={13} />
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment.mutate({ id: deal.id, index: idx })}
                  className="text-brand-subtle hover:text-brand-danger p-1"
                >
                  <X size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
