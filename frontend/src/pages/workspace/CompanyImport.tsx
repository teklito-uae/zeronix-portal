import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceList } from '@/hooks/useApi';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LabelSelector } from '@/components/shared/LabelSelector';
import { LabelBadge } from '@/components/shared/LabelBadge';
import { SEO } from '@/components/shared/SEO';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Upload, FileText, AlertTriangle, CheckCircle2, XCircle, ArrowLeft,
  ArrowRight, Users, Loader2, Merge, Trash2, Eye, X,
} from 'lucide-react';
import type { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  conflict: boolean;
  existing_customer_id: number | null;
  action: 'create' | 'merge' | 'skip';
}

type Step = 1 | 2 | 3;

// ── Step Indicator ────────────────────────────────────────────────────────────

const StepIndicator = ({ current }: { current: Step }) => {
  const steps = [
    { n: 1, label: 'Upload & Label', icon: Upload },
    { n: 2, label: 'Preview & Edit', icon: Eye },
    { n: 3, label: 'Confirm Import', icon: CheckCircle2 },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        const Icon = s.icon;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-zeronix-blue border-zeronix-blue text-white' :
                'bg-admin-bg border-admin-border text-admin-text-muted'
              }`}>
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[10px] font-bold whitespace-nowrap ${active ? 'text-zeronix-blue' : done ? 'text-emerald-600' : 'text-admin-text-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${done ? 'bg-emerald-500' : 'bg-admin-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const CompanyImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [results, setResults] = useState<{ created: number; merged: number; skipped: number; errors: string[] } | null>(null);

  const { data: staffData } = useResourceList<User>('users', { per_page: 100 });
  const staffMembers = (staffData?.data || []).filter((u: any) => u.role !== 'customer');

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['vcf', 'json'].includes(ext || '')) {
      toast.error('Only .vcf and .json files are supported');
      return;
    }
    
    // PHP's default upload_max_filesize is 2MB. 
    // We validate client-side to prevent generic "failed to upload" errors.
    const maxSizeMB = 2;
    if (f.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setFile(f);
    setRows([]);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Preview step ──────────────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/admin/customers/import/preview`, fd);
      const parsed: ParsedRow[] = res.data.rows.map((r: any) => ({
        ...r,
        action: r.conflict ? 'skip' : 'create',
      }));
      setRows(parsed);
      setStep(2);
      if (res.data.conflict_count > 0) {
        toast.warning(`${res.data.conflict_count} conflict(s) detected — review before importing`);
      } else {
        toast.success(`${res.data.total} contacts parsed — review before importing`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  // ── Commit step ───────────────────────────────────────────────────────────

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const res = await api.post(`/admin/customers/import/commit`, {
        rows,
        label_ids: labelIds,
        user_id: assignUserId || undefined,
      });
      setResults(res.data.results);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsCommitting(false);
    }
  };

  const updateRow = (idx: number, field: keyof ParsedRow, value: any) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const conflictCount = rows.filter(r => r.conflict && r.action !== 'skip').length;
  const toImport = rows.filter(r => r.action !== 'skip').length;

  // ── STEP 1 ────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Drop zone */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text-primary mb-1">1. Select File</h3>
          <p className="text-xs text-admin-text-muted">Supports .vcf (vCard) and .json formats</p>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center select-none ${
            dragOver ? 'border-zeronix-blue bg-zeronix-blue/5 scale-[1.01]' :
            file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-admin-border hover:border-zeronix-blue/40 hover:bg-admin-bg/50 bg-admin-surface'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.json"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <FileText size={28} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-admin-text-primary">{file.name}</p>
              <p className="text-xs text-admin-text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); setRows([]); }}
                className="mt-3 text-[11px] text-red-500 hover:underline flex items-center gap-1"
              >
                <X size={12} /> Remove file
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-admin-bg flex items-center justify-center mb-3 border border-admin-border">
                <Upload size={26} className={dragOver ? 'text-zeronix-blue' : 'text-admin-text-muted'} />
              </div>
              <p className="text-sm font-bold text-admin-text-primary">Drop file here</p>
              <p className="text-xs text-admin-text-muted mt-1">or click to browse</p>
              <div className="flex gap-2 mt-4">
                {['.vcf', '.json'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 bg-admin-bg border border-admin-border rounded-full text-[10px] font-bold text-admin-text-muted">
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sample format hints */}
        <div className="bg-admin-bg border border-admin-border rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-admin-text-muted uppercase tracking-wider">JSON Format Example</p>
          <pre className="text-[10px] text-admin-text-secondary font-mono overflow-x-auto">{`[
  {
    "name": "Ahmed Al Rashid",
    "company": "Al Noor LLC",
    "phone": "+971501234567",
    "email": "ahmed@alnoor.ae"
  }
]`}</pre>
        </div>
      </div>

      {/* Labels & Assignment */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-admin-text-primary mb-1">2. Assign Labels</h3>
          <p className="text-xs text-admin-text-muted">Tag this import for easy filtering and team assignment</p>
        </div>
        <LabelSelector selectedIds={labelIds} onChange={setLabelIds} />

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-admin-text-primary">3. Assign to Staff (Optional)</h3>
          <p className="text-xs text-admin-text-muted">All imported contacts will be assigned to this staff member</p>
          <Select value={assignUserId} onValueChange={setAssignUserId}>
            <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl">
              <SelectValue placeholder="Leave unassigned (assign later)" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border text-admin-text-primary">
              {staffMembers.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name} <span className="text-admin-text-muted text-xs">({s.role})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handlePreview}
          disabled={!file || isPreviewing}
          className="w-full h-12 bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-bold rounded-xl shadow-lg shadow-zeronix-blue/20 text-sm"
        >
          {isPreviewing ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing file...</>
          ) : (
            <><Eye size={16} className="mr-2" /> Preview Contacts <ArrowRight size={16} className="ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );

  // ── STEP 2 ────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-admin-bg border border-admin-border rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-admin-text-primary">
          <Users size={14} className="text-zeronix-blue" />
          <span>{rows.length} contacts</span>
        </div>
        {conflictCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
            <AlertTriangle size={12} /> {conflictCount} conflict(s)
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
          <CheckCircle2 size={12} /> {toImport} to import
        </div>
        <div className="ml-auto text-[11px] text-admin-text-muted">
          {rows.filter(r => r.action === 'skip').length} skipped
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider w-8">#</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">Status</th>
                <th className="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    row.conflict && row.action !== 'skip' ? 'bg-amber-500/5' :
                    row.action === 'skip' ? 'opacity-40 bg-admin-bg/30' :
                    'hover:bg-admin-bg/30'
                  }`}
                >
                  <td className="px-4 py-2 text-admin-text-muted font-mono">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      value={row.name}
                      onChange={e => updateRow(idx, 'name', e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-admin-border focus:border-zeronix-blue outline-none text-admin-text-primary font-medium py-0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={row.email || ''}
                      onChange={e => updateRow(idx, 'email', e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-admin-border focus:border-zeronix-blue outline-none text-admin-text-secondary py-0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={row.phone || ''}
                      onChange={e => updateRow(idx, 'phone', e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-admin-border focus:border-zeronix-blue outline-none text-admin-text-secondary py-0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={row.company || ''}
                      onChange={e => updateRow(idx, 'company', e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-admin-border focus:border-zeronix-blue outline-none text-admin-text-secondary py-0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {row.conflict ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateRow(idx, 'action', row.action === 'merge' ? 'skip' : 'merge')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            row.action === 'merge'
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-600'
                              : 'bg-amber-500/10 border-amber-500/40 text-amber-600'
                          }`}
                          title={row.action === 'merge' ? 'Click to skip' : 'Click to merge with existing'}
                        >
                          {row.action === 'merge' ? <><Merge size={10} /> Merge</> : <><AlertTriangle size={10} /> Conflict</>}
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 size={10} /> New
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => removeRow(idx)}
                      className="p-1 text-admin-text-muted hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => { setStep(1); setRows([]); }} className="border-admin-border text-admin-text-secondary rounded-xl">
          <ArrowLeft size={15} className="mr-2" /> Back
        </Button>
        <Button
          onClick={handleCommit}
          disabled={isCommitting || toImport === 0}
          className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-bold rounded-xl px-8 shadow-lg shadow-zeronix-blue/20"
        >
          {isCommitting ? (
            <><Loader2 size={15} className="animate-spin mr-2" /> Importing...</>
          ) : (
            <><CheckCircle2 size={15} className="mr-2" /> Import {toImport} Contact{toImport !== 1 ? 's' : ''}</>
          )}
        </Button>
      </div>
    </div>
  );

  // ── STEP 3 ────────────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="flex flex-col items-center text-center py-8 gap-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/30">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-admin-text-primary">Import Complete!</h3>
        <p className="text-sm text-admin-text-muted mt-1">Your contacts have been processed successfully.</p>
      </div>

      {results && (
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{results.created}</p>
            <p className="text-xs text-admin-text-muted mt-1 font-bold uppercase">Created</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-blue-600">{results.merged}</p>
            <p className="text-xs text-admin-text-muted mt-1 font-bold uppercase">Merged</p>
          </div>
          <div className="bg-admin-bg border border-admin-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-admin-text-secondary">{results.skipped}</p>
            <p className="text-xs text-admin-text-muted mt-1 font-bold uppercase">Skipped</p>
          </div>
        </div>
      )}

      {results?.errors && results.errors.length > 0 && (
        <div className="w-full max-w-md bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-left">
          <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><XCircle size={12} /> {results.errors.length} Error(s)</p>
          <ul className="space-y-1">
            {results.errors.map((err, i) => (
              <li key={i} className="text-[11px] text-red-500 font-mono">{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => { setStep(1); setFile(null); setRows([]); setLabelIds([]); setAssignUserId(''); setResults(null); }}
          className="border-admin-border text-admin-text-secondary rounded-xl"
        >
          Import More
        </Button>
        <Button
          onClick={() => navigate(`${getBasePath()}/companies`)}
          className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-bold rounded-xl px-6"
        >
          <Users size={15} className="mr-2" /> View Companies
        </Button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <SEO title="Import Contacts" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`${getBasePath()}/companies`)}
          className="p-2 rounded-xl border border-admin-border bg-admin-surface hover:bg-admin-bg transition-colors text-admin-text-muted hover:text-admin-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="p-2.5 bg-zeronix-blue/10 rounded-xl text-zeronix-blue">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-admin-text-primary tracking-tight">Import Contacts</h2>
          <p className="text-xs text-admin-text-muted mt-0.5">Upload VCF or JSON to bulk-import companies with labels</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 shadow-sm">
        <StepIndicator current={step} />
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};
