import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, Paperclip, UploadCloud, X, Download } from 'lucide-react';
import type { QuoteAttachment } from '@/types';
import type { TransactionType } from '@/lib/transactionTypes';

interface AttachmentsPanelProps {
  type: TransactionType;
  docId?: number;
  isNew: boolean;
  attachments: QuoteAttachment[];
  apiBase: string;
}

const storageBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Drag-and-drop upload zone + attachment list. Reuses the Quote attachment
 * endpoints for quotes, and the mirrored (backend-agent-added) Invoice
 * attachment endpoints for invoices — same path shape under /admin/invoices/...
 */
export const AttachmentsPanel = ({ type, docId, isNew, attachments, apiBase }: AttachmentsPanelProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const invalidate = () => {
    if (docId) queryClient.invalidateQueries({ queryKey: [apiBase, String(docId)] });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/admin/${apiBase}/${docId}/attachments`, formData)).data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const remove = useMutation({
    mutationFn: async (index: number) => (await api.delete(`/admin/${apiBase}/${docId}/attachments/${index}`)).data,
    onSuccess: () => {
      toast.success('Attachment removed.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove attachment.'),
  });

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) upload.mutate(file);
  };

  const label = type === 'quote' ? 'quote' : 'invoice';

  return (
    <div className="bg-brand-white border border-brand-border rounded-lg p-4">
      <p className="text-[13px] font-semibold text-brand-primary mb-3">Attachments</p>

      {isNew && !docId ? (
        <p className="text-[12px] text-brand-subtle italic bg-brand-bg border border-dashed border-brand-border rounded-lg px-3 py-4 text-center">
          Save the {label} first to add attachments.
        </p>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-brand-accent bg-brand-accent-light' : 'border-brand-border hover:bg-brand-bg'
            }`}
          >
            {upload.isPending ? (
              <Loader2 size={18} className="animate-spin text-brand-accent" />
            ) : (
              <UploadCloud size={18} className="text-brand-subtle" />
            )}
            <p className="text-[12px] text-brand-muted">
              <span className="font-medium text-brand-accent">Click to upload</span> or drag and drop
            </p>
          </div>

          {attachments.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {attachments.map((att, idx) => (
                <li
                  key={`${att.path}-${idx}`}
                  className="flex items-center justify-between gap-2 bg-brand-bg rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={13} className="text-brand-subtle flex-shrink-0" />
                    <span className="text-[12px] text-brand-primary truncate">{att.name}</span>
                    {att.size !== undefined && (
                      <span className="text-[11px] text-brand-subtle flex-shrink-0">{formatFileSize(att.size)}</span>
                    )}
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
                      onClick={() => remove.mutate(idx)}
                      className="text-brand-subtle hover:text-brand-danger p-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
