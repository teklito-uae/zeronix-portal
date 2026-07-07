import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
} from 'lucide-react';
import { VariableMenu } from './VariableMenu';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

/**
 * TipTap rich-text editor with a raw-HTML source toggle and a variable
 * insertion menu. In HTML mode the full document (including table-based
 * email markup TipTap can't represent) is edited as-is.
 */
export const RichTextEditor = ({ value, onChange, minHeight = 360 }: RichTextEditorProps) => {
  const [mode, setMode] = useState<'rich' | 'html'>('rich');
  const [htmlDraft, setHtmlDraft] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 text-[13px] text-brand-primary',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Keep the editor in sync when an external value arrives (e.g. template loaded)
  useEffect(() => {
    if (editor && mode === 'rich' && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    if (mode === 'html') {
      setHtmlDraft(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const switchMode = (next: 'rich' | 'html') => {
    if (next === mode) return;
    if (next === 'html') {
      setHtmlDraft(value);
    } else if (editor) {
      editor.commands.setContent(htmlDraft || '', { emitUpdate: false });
      onChange(htmlDraft);
    }
    setMode(next);
  };

  const insertVariable = (token: string) => {
    if (mode === 'html') {
      const next = htmlDraft + token;
      setHtmlDraft(next);
      onChange(next);
      return;
    }
    editor?.chain().focus().insertContent(token).run();
  };

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

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL', 'https://');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors',
        active ? 'bg-brand-accent-light text-brand-accent' : 'text-brand-secondary hover:bg-brand-surface'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-brand-border bg-brand-surface/50 flex-wrap">
        <div className="flex items-center gap-0.5 flex-wrap">
          {mode === 'rich' && editor && (
            <>
              <ToolButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolButton>
              <ToolButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolButton>
              <ToolButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolButton>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <ToolButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></ToolButton>
              <ToolButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></ToolButton>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <ToolButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolButton>
              <ToolButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolButton>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <ToolButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={14} /></ToolButton>
              <ToolButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={14} /></ToolButton>
              <ToolButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={14} /></ToolButton>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <ToolButton title="Link" active={editor.isActive('link')} onClick={setLink}><LinkIcon size={14} /></ToolButton>
              <ToolButton title="Image" onClick={addImage}><ImageIcon size={14} /></ToolButton>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <ToolButton title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo size={14} /></ToolButton>
              <ToolButton title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo size={14} /></ToolButton>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <VariableMenu onInsert={insertVariable} />
          <Button
            variant={mode === 'html' ? 'default' : 'outline'}
            type="button"
            className="h-8 text-[12px] gap-1.5"
            onClick={() => switchMode(mode === 'html' ? 'rich' : 'html')}
          >
            <Code size={13} />
            {mode === 'html' ? 'Rich Text' : 'HTML'}
          </Button>
        </div>
      </div>

      {/* Body */}
      {mode === 'rich' ? (
        <EditorContent editor={editor} />
      ) : (
        <Textarea
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="border-0 rounded-none font-mono text-[12px] leading-relaxed focus-visible:ring-0"
          style={{ minHeight }}
        />
      )}
    </div>
  );
};
