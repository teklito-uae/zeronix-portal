import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus, ListTodo, Activity, StickyNote as StickyNoteIcon,
  Trash2, CheckCircle2, Circle, Bold, Italic, Underline, List,
  Calendar, Loader2
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task     { id: number; title: string; status: string; due_date?: string; }
interface Note     { id: number; content: string; color: string; }
interface Activity { description: string; created_at: string; action?: string; }

// ── Note color palette ────────────────────────────────────────────────────────
const NOTE_PALETTE = [
  { key: 'yellow', label: 'Yellow', bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400',   ring: 'ring-amber-400'  },
  { key: 'pink',   label: 'Pink',   bg: 'bg-pink-50',    border: 'border-pink-200',   dot: 'bg-pink-400',    ring: 'ring-pink-400'   },
  { key: 'blue',   label: 'Blue',   bg: 'bg-sky-50',     border: 'border-sky-200',    dot: 'bg-sky-400',     ring: 'ring-sky-400'    },
  { key: 'green',  label: 'Green',  bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-400', ring: 'ring-emerald-400'},
  { key: 'purple', label: 'Purple', bg: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-400',  ring: 'ring-violet-400' },
] as const;

type NoteColorKey = typeof NOTE_PALETTE[number]['key'];
const DEFAULT_COLOR: NoteColorKey = 'yellow';

const getNoteStyle = (color: string) =>
  NOTE_PALETTE.find(p => p.key === color) ?? NOTE_PALETTE[0];

// ── Activity timeline dot color ───────────────────────────────────────────────
const activityDotColor = (action = '') => {
  if (action.includes('invoice'))  return 'bg-emerald-400';
  if (action.includes('quote'))    return 'bg-amber-400';
  if (action.includes('enquiry'))  return 'bg-indigo-400';
  if (action.includes('customer')) return 'bg-blue-400';
  return 'bg-brand-border-strong';
};

// ── ProductivitySuite ─────────────────────────────────────────────────────────
export const ProductivitySuite = ({ activities = [] }: { activities: Activity[] }) => {
  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get(`/admin/tasks`)).data,
  });

  const { data: stickyNotes = [], isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ['sticky-notes'],
    queryFn: async () => (await api.get(`/admin/sticky-notes`)).data,
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get(`/admin/users?per_page=100`)).data.data || [],
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => (await api.post(`/admin/tasks`, { title })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task added.'); },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; due_date?: string; assigned_to?: number | null }) => 
      (await api.post(`/admin/tasks`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully.');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', due_date: '', assigned_to: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task.');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      (await api.put(`/admin/tasks/${id}`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: async (color: string) =>
      (await api.post(`/admin/sticky-notes`, { content: '', color })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }); },
    onError: () => toast.error('Failed to create note.'),
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content, color }: { id: number; content?: string; color?: string }) =>
      (await api.put(`/admin/sticky-notes/${id}`, { content, color })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/sticky-notes/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
    onError: () => toast.error('Failed to delete note.'),
  });

  // ── Local state ──────────────────────────────────────────────────────────────
  const [newTaskTitle, setNewTaskTitle]       = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
  });
  const [activeNoteId, setActiveNoteId]       = useState<number | null>(null);
  const [selectedColor, setSelectedColor]     = useState<NoteColorKey>(DEFAULT_COLOR);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const noteRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTaskMutation.mutate(newTaskTitle);
    setNewTaskTitle('');
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required.');
      return;
    }
    createTaskMutation.mutate({
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      due_date: taskForm.due_date || undefined,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
    });
  };

  const handleAddNote = () => {
    addNoteMutation.mutate(selectedColor);
    setShowColorPicker(false);
  };

  const execFormat = (cmd: string) => document.execCommand(cmd, false);

  // ── Section header ────────────────────────────────────────────────────────
  const SectionHead = ({
    icon, title, action,
  }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
        {icon}{title}
      </div>
      {action}
    </div>
  );

  const Empty = ({ msg }: { msg: string }) => (
    <p className="text-center text-[12px] text-brand-subtle py-10 italic">{msg}</p>
  );

  const TaskRow = ({ task, showDue = false }: { task: Task; showDue?: boolean }) => (
    <div className="flex items-start gap-3 bg-brand-bg rounded-lg p-3 border border-brand-border hover:bg-brand-surface transition-colors">
      <button
        onClick={() => toggleTaskMutation.mutate({
          id: task.id,
          status: task.status === 'completed' ? 'pending' : 'completed',
        })}
        className="mt-0.5 flex-shrink-0"
      >
        {task.status === 'completed'
          ? <CheckCircle2 size={15} className="text-brand-success" />
          : <Circle size={15} className="text-brand-subtle hover:text-brand-muted transition-colors" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium leading-snug ${
          task.status === 'completed' ? 'line-through text-brand-subtle' : 'text-brand-primary'
        }`}>
          {task.title}
        </p>
        {showDue && task.due_date && (
          <p className="text-[11px] text-brand-subtle mt-0.5">Due: {task.due_date}</p>
        )}
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── COLUMN 1: Task Manager ─────────────────────────────────────────── */}
        <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
          <SectionHead
            icon={<ListTodo size={16} className="text-brand-info" />}
            title="Task Manager"
            action={
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1 text-[12px] font-medium text-brand-secondary bg-brand-surface border border-brand-border px-2.5 py-1 rounded-md hover:bg-brand-bg transition-colors"
              >
                <Plus size={13} /> Add Task
              </button>
            }
          />
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <Tabs defaultValue="mine" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-brand-surface border border-brand-border p-0.5 rounded-lg h-8 mb-3">
                <TabsTrigger value="mine" className="rounded-md text-[12px] font-medium h-full data-[state=active]:bg-brand-white data-[state=active]:text-brand-primary">
                  My Tasks
                </TabsTrigger>
                <TabsTrigger value="assigned" className="rounded-md text-[12px] font-medium h-full data-[state=active]:bg-brand-white data-[state=active]:text-brand-primary">
                  Assigned
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mine" className="space-y-2 mt-0">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    id="task-input"
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-[13px] text-brand-primary placeholder:text-brand-subtle outline-none focus:border-brand-accent transition-colors"
                  />
                  <button type="submit" className="h-9 w-9 flex items-center justify-center rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors flex-shrink-0">
                    <Plus size={14} />
                  </button>
                </form>
                <div className="space-y-2 pt-1">
                  {tasksLoading
                    ? <p className="text-center text-[12px] text-brand-subtle py-4">Loading…</p>
                    : (tasksData?.mine?.length === 0
                      ? <Empty msg="No tasks. Add one above." />
                      : tasksData?.mine?.map((t: Task) => <TaskRow key={t.id} task={t} />))}
                </div>
              </TabsContent>

              <TabsContent value="assigned" className="space-y-2 mt-0">
                {tasksLoading
                  ? <p className="text-center text-[12px] text-brand-subtle py-4">Loading…</p>
                  : (tasksData?.assigned?.length === 0
                    ? <Empty msg="No tasks assigned." />
                    : tasksData?.assigned?.map((t: Task) => <TaskRow key={t.id} task={t} showDue />))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── COLUMN 2: Activity Timeline ────────────────────────────────────── */}
        <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
          <SectionHead
            icon={<Activity size={16} className="text-brand-accent" />}
            title="Activity Timeline"
          />
          <div className="flex-1 overflow-auto p-5">
            {activities.length === 0 ? (
              <Empty msg="No recent activity." />
            ) : (
              <div className="relative border-l-2 border-brand-border ml-2 space-y-5">
                {activities.map((act, i) => (
                  <div key={i} className="relative pl-5">
                    <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-brand-white ${activityDotColor(act.action)}`} />
                    <p className="text-[13px] font-medium text-brand-primary leading-snug">{act.description}</p>
                    <p className="text-[11px] text-brand-subtle mt-0.5">{timeAgo(act.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── COLUMN 3: Sticky Notes ─────────────────────────────────────────── */}
        <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
          <SectionHead
            icon={<StickyNoteIcon size={16} className="text-amber-500" />}
            title="Quick Notes"
            action={
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(v => !v)}
                  className="h-7 flex items-center gap-1.5 px-2.5 rounded-md bg-brand-surface border border-brand-border hover:bg-brand-bg transition-colors text-[12px] font-medium text-brand-muted"
                >
                  {/* Color preview dot */}
                  <span className={`h-3 w-3 rounded-full flex-shrink-0 ${getNoteStyle(selectedColor).dot}`} />
                  <Plus size={12} />
                </button>

                {/* Color picker dropdown */}
                {showColorPicker && (
                  <div className="absolute right-0 top-9 z-30 bg-brand-white border border-brand-border rounded-xl shadow-lg p-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle mb-2">Pick color</p>
                    <div className="flex gap-2 mb-3">
                      {NOTE_PALETTE.map(p => (
                        <button
                          key={p.key}
                          onClick={() => setSelectedColor(p.key)}
                          title={p.label}
                          className={`h-6 w-6 rounded-full ${p.dot} transition-all ${
                            selectedColor === p.key
                              ? `ring-2 ring-offset-2 ${p.ring} scale-110`
                              : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleAddNote}
                      disabled={addNoteMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold bg-brand-primary text-white py-1.5 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-60"
                    >
                      <Plus size={12} /> Add Note
                    </button>
                  </div>
                )}
              </div>
            }
          />

          {/* Format toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-brand-border bg-brand-surface">
            {([
              { cmd: 'bold',                icon: <Bold size={12} />,      label: 'Bold' },
              { cmd: 'italic',              icon: <Italic size={12} />,    label: 'Italic' },
              { cmd: 'underline',           icon: <Underline size={12} />, label: 'Underline' },
              { cmd: 'insertUnorderedList', icon: <List size={12} />,      label: 'List' },
            ] as const).map(({ cmd, icon, label }) => (
              <button
                key={cmd}
                title={label}
                onMouseDown={e => { e.preventDefault(); execFormat(cmd); }}
                className="h-6 w-6 flex items-center justify-center rounded text-brand-muted hover:bg-brand-border hover:text-brand-primary transition-colors"
              >
                {icon}
              </button>
            ))}
            <div className="w-px h-4 bg-brand-border mx-1.5" />
            <p className="text-[10px] text-brand-subtle">Format active note</p>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-auto p-4 space-y-3" onClick={() => setShowColorPicker(false)}>
            {notesLoading ? (
              <p className="text-center text-[12px] text-brand-subtle py-4">Loading notes…</p>
            ) : (stickyNotes as Note[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <StickyNoteIcon size={28} className="text-amber-300" />
                <p className="text-[12px] text-brand-subtle italic">Click the + button to add a note</p>
              </div>
            ) : (
              (stickyNotes as Note[]).map(note => {
                const style    = getNoteStyle(note.color);
                const isActive = activeNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={e => { e.stopPropagation(); setActiveNoteId(note.id); }}
                    className={`rounded-xl border p-3 group transition-all duration-150 ${style.bg} ${style.border} ${
                      isActive ? 'ring-2 ring-offset-1 ' + style.ring : ''
                    }`}
                  >
                    {/* Note header */}
                    <div className="flex items-center justify-between mb-2">
                      {/* Color swatches to change color */}
                      <div className="flex items-center gap-1">
                        {NOTE_PALETTE.map(p => (
                          <button
                            key={p.key}
                            onClick={e => {
                              e.stopPropagation();
                              updateNoteMutation.mutate({ id: note.id, color: p.key });
                            }}
                            className={`h-3 w-3 rounded-full ${p.dot} transition-transform hover:scale-125 ${
                              note.color === p.key ? 'ring-1 ring-offset-1 ' + p.ring : 'opacity-50 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteNoteMutation.mutate(note.id); }}
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Editable content */}
                    <div
                      ref={el => { noteRefs.current[note.id] = el; }}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={() => setActiveNoteId(note.id)}
                      onBlur={e => {
                        updateNoteMutation.mutate({ id: note.id, content: e.currentTarget.innerHTML });
                      }}
                      className="text-[13px] text-brand-primary outline-none min-h-[52px] leading-relaxed cursor-text"
                      dangerouslySetInnerHTML={{ __html: note.content || '' }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── Task Creation Modal ─────────────────────────────────────────── */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="bg-brand-white border-brand-border rounded-2xl p-6 sm:max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-2">
              <ListTodo size={18} className="text-brand-info" /> Create New Task
            </DialogTitle>
            <DialogDescription className="text-xs text-brand-muted mt-1">
              Add a new task to your dashboard or assign it to a team member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTaskSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Task Title *</Label>
              <Input
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="What needs to be done?"
                className="h-9 bg-brand-bg border-brand-border text-brand-primary rounded-lg text-[13px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Add more details about this task..."
                className="bg-brand-bg border-brand-border rounded-lg text-[13px] min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary">Due Date</Label>
                <Input
                  type="date"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="h-9 bg-brand-bg border-brand-border text-brand-primary rounded-lg text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary">Assign To</Label>
                <Select
                  value={taskForm.assigned_to}
                  onValueChange={v => setTaskForm({ ...taskForm, assigned_to: v })}
                >
                  <SelectTrigger className="h-9 bg-brand-bg border-brand-border text-brand-primary rounded-lg text-[13px]">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-white border-brand-border rounded-xl text-[13px] max-h-[200px]">
                    <SelectItem value="none">Assign to Myself</SelectItem>
                    {usersList.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending || !taskForm.title.trim()}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary text-white h-9 rounded-lg text-[13px] font-medium shadow-md"
              >
                {createTaskMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
