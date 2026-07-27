import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import workspaceDocs from '@/content/workspaceDocs.md?raw';

interface TocEntry {
  id: string;
  label: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const buildToc = (markdown: string): TocEntry[] =>
  markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => {
      const label = line.replace(/^##\s+/, '').trim();
      return { id: slugify(label), label };
    });

export const Documentation = () => {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>('');
  const toc = useMemo(() => buildToc(workspaceDocs), []);
  const filteredToc = useMemo(
    () => toc.filter((entry) => entry.label.toLowerCase().includes(query.toLowerCase())),
    [toc, query]
  );

  useEffect(() => {
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Table of contents */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-brand-border bg-brand-white">
        <div className="p-4 border-b border-brand-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-brand-accent-light text-brand-accent">
              <BookOpen size={16} />
            </div>
            <h2 className="text-[13px] font-semibold text-brand-primary">Documentation</h2>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter modules..."
              className="h-8 pl-7 text-[12px] bg-brand-surface border-brand-border"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {filteredToc.map((entry) => (
            <button
              key={entry.id}
              onClick={() => scrollTo(entry.id)}
              className={cn(
                'w-full text-left px-2.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors truncate block',
                activeId === entry.id
                  ? 'bg-brand-accent-light text-brand-accent'
                  : 'text-brand-muted hover:bg-brand-surface hover:text-brand-primary'
              )}
            >
              {entry.label}
            </button>
          ))}
          {filteredToc.length === 0 && (
            <p className="px-2.5 py-2 text-[12px] text-brand-subtle">No matching sections.</p>
          )}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
          <div className="mb-6 pb-6 border-b border-brand-border">
            <h1 className="text-2xl font-bold text-brand-primary tracking-tight">Workspace Guide</h1>
            <p className="text-[13px] text-brand-subtle mt-1">
              How to use every module in your Zeronix workspace, from first lead to final payment.
            </p>
          </div>

          <article
            className={cn(
              'prose prose-sm max-w-none',
              'prose-headings:font-semibold prose-headings:text-brand-primary prose-headings:scroll-mt-24',
              'prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3 prose-h2:first:mt-0',
              'prose-p:text-brand-secondary prose-li:text-brand-secondary',
              'prose-strong:text-brand-primary',
              'prose-a:text-brand-accent prose-a:no-underline hover:prose-a:underline',
              'prose-hr:border-brand-border',
              'prose-code:text-brand-accent prose-code:bg-brand-surface prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none'
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
              {workspaceDocs}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};
