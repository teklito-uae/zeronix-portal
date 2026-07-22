import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface NotesEditorProps {
  value: string;
  onChange: (html: string) => void;
  softCap?: number;
}

/**
 * Small dedicated Tiptap wrapper for "Notes to Customer" — a minimal toolbar
 * (Bold/Italic/Underline/lists/link only) plus a soft character counter.
 * Not a reuse of RichTextEditor.tsx (that one is heavier, marketing-specific).
 */
export const NotesEditor = ({ value, onChange, softCap = 1000 }: NotesEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2.5 text-[13px] text-brand-primary min-h-[100px]',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const charCount = editor ? editor.getText().length : (value || '').replace(/<[^>]*>/g, '').length;

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors',
        active ? 'bg-brand-accent-light text-brand-accent' : 'text-brand-muted hover:bg-brand-surface hover:text-brand-primary'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-brand-border bg-brand-surface/50">
        {editor && (
          <>
            <ToolButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></ToolButton>
            <ToolButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></ToolButton>
            <ToolButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></ToolButton>
            <div className="w-px h-4 bg-brand-border mx-1" />
            <ToolButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></ToolButton>
            <ToolButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></ToolButton>
            <div className="w-px h-4 bg-brand-border mx-1" />
            <ToolButton title="Link" active={editor.isActive('link')} onClick={setLink}><LinkIcon size={13} /></ToolButton>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      <div className="px-3 py-1.5 border-t border-brand-border/60 text-right">
        <span className={cn('text-[11px]', charCount > softCap ? 'text-brand-warning font-medium' : 'text-brand-subtle')}>
          {charCount} / {softCap}
        </span>
      </div>
    </div>
  );
};
