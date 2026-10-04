import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Search,
  Pin,
  Trash2,
  FileText,
  X,
  Share2,
  Check,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  updatedAt: number;
  createdAt: number;
}

const NOTES_STORAGE_KEY = 'ios_notes_list_v2';

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note_starter_1',
    title: '欢迎使用 iOS 备忘录',
    content: '欢迎使用 iOS 备忘录\n这里是您的专属记事空间。支持即时输入自动保存、文章置顶、全文即时检索与长按快捷菜单。\n第一行将自动作为备忘录标题显示。',
    isPinned: true,
    updatedAt: Date.now() - 1000 * 60 * 30,
    createdAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'note_starter_2',
    title: '灵感与随手记录',
    content: '灵感与随手记录\n保持热爱，奔赴山海。\n随时随地记录生活中的点滴思考与火花。',
    isPinned: false,
    updatedAt: Date.now() - 1000 * 60 * 120,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

export const NotesApp: React.FC = () => {
  const { goHome } = useChat();

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load notes from storage', e);
    }
    return INITIAL_NOTES;
  });

  const saveNotes = (newNotes: NoteItem[]) => {
    setNotes(newNotes);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
      }
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  };

  // View state: 'list' | 'edit'
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Context menu on long press
  const [contextMenuNote, setContextMenuNote] = useState<NoteItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Note being edited
  const currentNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  // Filter & sort notes: Pinned first, then by updatedAt desc
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      : notes;

    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, searchQuery]);

  // Create a new note
  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: 'note_' + Date.now(),
      title: '新建备忘录',
      content: '',
      isPinned: false,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    saveNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  // Real-time update content in edit view (auto-save)
  const handleContentChange = (text: string) => {
    if (!activeNoteId) return;

    // First line as title
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim() || '新建备忘录';

    const updated = notes.map((n) =>
      n.id === activeNoteId
        ? {
            ...n,
            title: firstLine,
            content: text,
            updatedAt: Date.now(),
          }
        : n
    );
    saveNotes(updated);
  };

  // Toggle Pin
  const handleTogglePin = (noteId: string) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
    );
    saveNotes(updated);
    setContextMenuNote(null);
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    saveNotes(updated);
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
    setDeleteConfirmId(null);
    setContextMenuNote(null);
  };

  // Format time display
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isToday) {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Pointer events for long press on list item
  const handleItemPointerDown = (note: NoteItem) => {
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuNote(note);
      longPressTimerRef.current = null;
    }, 450);
  };

  const handleItemPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none text-[#1C1C1E] relative overflow-hidden">
      {/* ===================== VIEW 1: NOTES LIST ===================== */}
      {!activeNoteId && (
        <>
          {/* Top Header */}
          <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20 shrink-0">
            <div className="flex items-center justify-between h-9 mb-1">
              <button
                type="button"
                onClick={goHome}
                className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
                title="返回桌面 (Esc)"
              >
                <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
                <span>返回</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNote}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-900 cursor-pointer"
                title="新建备忘录"
              >
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs">
                  <Plus size={17} strokeWidth={2.5} />
                </span>
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
                备忘录
              </h1>
              <span className="text-[12px] text-neutral-400 font-normal">
                {notes.length} 条记录
              </span>
            </div>

            {/* Search Bar */}
            <div className="mt-2.5 relative flex items-center">
              <Search
                size={15}
                className="absolute left-3 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题或内容..."
                className="w-full h-9 pl-9 pr-8 text-[14px] bg-[#E3E3E8] rounded-xl text-neutral-900 placeholder:text-neutral-500 outline-none focus:bg-[#EAEAEF] focus:ring-1 focus:ring-black/15 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Notes Content List */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            {filteredNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-500 mb-3 shadow-2xs">
                  <FileText size={28} />
                </div>
                <p className="text-[15px] font-medium text-neutral-700">
                  {searchQuery ? '未找到相关备忘录' : '暂无备忘录'}
                </p>
                <p className="text-[12px] text-neutral-400 mt-1 max-w-[200px]">
                  {searchQuery
                    ? '尝试使用其他关键字搜索'
                    : '点击右上角「＋」开始新建一条备忘录'}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform cursor-pointer shadow-xs"
                  >
                    新建备忘录
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.05]">
                {filteredNotes.map((note) => {
                  const contentLines = note.content.split('\n');
                  const previewSnippet =
                    contentLines.length > 1
                      ? contentLines.slice(1).join(' ').trim()
                      : '无附加文本';

                  return (
                    <div
                      key={note.id}
                      onPointerDown={() => handleItemPointerDown(note)}
                      onPointerUp={handleItemPointerUp}
                      onClick={() => setActiveNoteId(note.id)}
                      className="p-3.5 flex items-center justify-between gap-3 active:bg-neutral-50 transition-colors cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {note.isPinned && (
                            <Pin
                              size={13}
                              className="text-amber-500 fill-amber-500 shrink-0 -rotate-45"
                            />
                          )}
                          <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                            {note.title || '无标题'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] text-neutral-400 font-mono shrink-0">
                            {formatTime(note.updatedAt)}
                          </span>
                          <span className="text-[12px] text-neutral-500 truncate">
                            {previewSnippet}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== VIEW 2: NOTE EDITOR ===================== */}
      {activeNoteId && currentNote && (
        <div className="w-full h-full flex flex-col bg-[#F2F2F7] animate-in slide-in-from-right duration-200">
          {/* Editor Header */}
          <div className="ios-safe-header px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20 shrink-0">
            <div className="h-11 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveNoteId(null)}
                className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
              >
                <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
                <span>备忘录</span>
              </button>

              <div className="flex items-center gap-1">
                {/* Pin Toggle */}
                <button
                  type="button"
                  onClick={() => handleTogglePin(currentNote.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 hover:text-black active:scale-90 transition-transform cursor-pointer"
                  title={currentNote.isPinned ? '取消置顶' : '置顶'}
                >
                  <Pin
                    size={17}
                    className={
                      currentNote.isPinned
                        ? 'text-amber-500 fill-amber-500 -rotate-45'
                        : 'text-neutral-500 -rotate-45'
                    }
                  />
                </button>

                {/* Delete Button with Confirmation */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(currentNote.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 active:scale-90 transition-transform cursor-pointer"
                  title="删除备忘录"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Time & Count Subheader */}
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>最后修改于 {new Date(currentNote.updatedAt).toLocaleTimeString()}</span>
            <span>{currentNote.content.length} 字</span>
          </div>

          {/* Large Clean Multiline Textarea */}
          <div
            className="flex-1 px-5 py-2 flex flex-col"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <textarea
              autoFocus
              value={currentNote.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="在此输入备忘录正文内容..."
              className="w-full flex-1 bg-transparent text-[16px] text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-relaxed select-text font-sans"
            />
          </div>
        </div>
      )}

      {/* Long-Press Action Sheet Menu */}
      {contextMenuNote && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setContextMenuNote(null)}
        >
          <div
            className="w-full bg-[#E5E5EA] rounded-t-[26px] p-4 space-y-2 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-black/[0.06] text-[16px]">
              <button
                type="button"
                onClick={() => handleTogglePin(contextMenuNote.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-neutral-900 active:bg-neutral-100 cursor-pointer"
              >
                <span>{contextMenuNote.isPinned ? '取消置顶' : '置顶备忘录'}</span>
                <Pin
                  size={17}
                  className={
                    contextMenuNote.isPinned
                      ? 'text-amber-500 fill-amber-500 -rotate-45'
                      : 'text-neutral-500 -rotate-45'
                  }
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(contextMenuNote.id);
                  setContextMenuNote(null);
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-[#FF3B30] active:bg-red-50 cursor-pointer font-medium"
              >
                <span>删除备忘录</span>
                <Trash2 size={17} className="text-[#FF3B30]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setContextMenuNote(null)}
              className="w-full py-3.5 bg-white rounded-2xl text-[16px] font-semibold text-neutral-800 active:bg-neutral-100 cursor-pointer text-center"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <IOSAlert
        isOpen={Boolean(deleteConfirmId)}
        title="删除备忘录"
        message="确定要删除该条备忘录吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteNote(deleteConfirmId);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
