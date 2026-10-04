import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Check,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  X,
  Bell,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export interface ReminderItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // ISO format string or YYYY-MM-DDTHH:mm
  createdAt: number;
  completedAt?: number;
}

const REMINDERS_STORAGE_KEY = 'ios_reminders_list_v1';

const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'reminder_init_1',
    title: '完善 AI 角色性格设定与背景故事',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString().slice(0, 16),
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'reminder_init_2',
    title: '测试计算器四则运算优先级 (12+3×4=24)',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString().slice(0, 16),
    createdAt: Date.now() - 1000 * 60 * 90,
  },
  {
    id: 'reminder_init_3',
    title: '整理生活备忘录与桌面布局',
    completed: true,
    completedAt: Date.now() - 1000 * 60 * 20,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

export const RemindersApp: React.FC = () => {
  const { goHome } = useChat();

  // 1. Reminders state with localStorage persistence
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load reminders from storage', e);
    }
    return INITIAL_REMINDERS;
  });

  const saveReminders = (newItems: ReminderItem[]) => {
    setReminders(newItems);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(newItems));
      }
    } catch (e) {
      console.error('Failed to save reminders to localStorage', e);
    }
  };

  // 2. Input Bar States
  const [inputText, setInputText] = useState('');
  const [inputDueDate, setInputDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 3. Edit Modal States
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // 4. Context Menu & Confirmation Alerts
  const [contextMenuItem, setContextMenuItem] = useState<ReminderItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ReminderItem | null>(null);
  const [showClearCompletedAlert, setShowClearCompletedAlert] = useState(false);

  // 5. In-App Notification Banner for Due Reminders
  const [activeBanner, setActiveBanner] = useState<ReminderItem | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Split reminders into uncompleted and completed
  const uncompletedList = useMemo(() => {
    return reminders
      .filter((r) => !r.completed)
      .sort((a, b) => {
        // Due date items first, then by createdAt desc
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [reminders]);

  const completedList = useMemo(() => {
    return reminders
      .filter((r) => r.completed)
      .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));
  }, [reminders]);

  // Check for due reminders every 3 seconds to show in-app banner
  useEffect(() => {
    const checkDueReminders = () => {
      const now = Date.now();
      for (const item of reminders) {
        if (!item.completed && item.dueDate) {
          const dueTime = new Date(item.dueDate).getTime();
          // If due within the last 15 minutes or overdue by a little and not yet alerted in this session
          if (dueTime <= now && now - dueTime < 1000 * 60 * 30 && !notifiedIdsRef.current.has(item.id)) {
            notifiedIdsRef.current.add(item.id);
            setActiveBanner(item);
            break;
          }
        }
      }
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 3000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Auto hide active banner after 6 seconds
  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner]);

  // Toggle completion
  const handleToggleComplete = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        const nextCompleted = !r.completed;
        return {
          ...r,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      }
      return r;
    });
    saveReminders(updated);
  };

  // Add new reminder
  const handleAddReminder = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newItem: ReminderItem = {
      id: 'reminder_' + Date.now(),
      title: trimmed,
      completed: false,
      dueDate: inputDueDate || undefined,
      createdAt: Date.now(),
    };

    saveReminders([newItem, ...reminders]);
    setInputText('');
    setInputDueDate('');
    setShowDatePicker(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: ReminderItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate || '');
    setContextMenuItem(null);
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!editingItem) return;
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    const updated = reminders.map((r) =>
      r.id === editingItem.id
        ? {
            ...r,
            title: trimmed,
            dueDate: editDueDate || undefined,
          }
        : r
    );

    saveReminders(updated);
    setEditingItem(null);
  };

  // Delete single reminder
  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);
    setDeleteConfirmItem(null);
    setContextMenuItem(null);
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
  };

  // Clear all completed reminders
  const handleClearCompleted = () => {
    const updated = reminders.filter((r) => !r.completed);
    saveReminders(updated);
    setShowClearCompletedAlert(false);
  };

  // Format Due Date with Overdue check
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const now = new Date();
    const isOverdue = due.getTime() < now.getTime();

    const isToday =
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate();

    const hours = due.getHours().toString().padStart(2, '0');
    const mins = due.getMinutes().toString().padStart(2, '0');

    let label = '';
    if (isToday) {
      label = `今天 ${hours}:${mins}`;
    } else {
      label = `${due.getMonth() + 1}月${due.getDate()}日 ${hours}:${mins}`;
    }

    return { label, isOverdue };
  };

  // Pointer events for item long press
  const handleItemPointerDown = (item: ReminderItem) => {
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuItem(item);
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
    <div className="w-full h-full flex flex-col justify-between bg-[#F2F2F7] select-none text-[#1C1C1E] relative overflow-hidden">
      {/* ================= IN-APP NOTIFICATION BANNER ================= */}
      {activeBanner && (
        <div className="absolute top-12 left-3 right-3 z-50 animate-in slide-in-from-top-6 duration-300">
          <div className="bg-[#2C2C2E]/95 backdrop-blur-xl text-white rounded-2xl p-3.5 shadow-2xl border border-white/15 flex items-center justify-between gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5E5CE6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold text-neutral-300">提醒事项</span>
                <span>到期提醒</span>
              </div>
              <p className="text-[14px] font-medium text-white truncate mt-0.5">
                {activeBanner.title}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleToggleComplete(activeBanner.id);
                  setActiveBanner(null);
                }}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] font-medium rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                完成
              </button>
              <button
                type="button"
                onClick={() => setActiveBanner(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOP NAVIGATION HEADER ================= */}
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
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            提醒事项
          </h1>
          <span className="text-[13px] font-medium text-neutral-500">
            未完成 {uncompletedList.length} 项
          </span>
        </div>
      </div>

      {/* ================= MAIN SCROLLABLE LIST ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Uncompleted Section */}
        <div className="space-y-2">
          {uncompletedList.length === 0 && completedList.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-500 mb-3 shadow-2xs">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-[15px] font-medium text-neutral-700">暂无待办事项</p>
              <p className="text-[12px] text-neutral-400 mt-1 max-w-[220px]">
                在下方输入框中快速添加任务或设置定时提醒
              </p>
            </div>
          ) : uncompletedList.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <Check size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[14px] font-medium text-neutral-700">所有事项均已完成！</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.05]">
              {uncompletedList.map((item) => {
                const dateInfo = formatDueDate(item.dueDate);
                return (
                  <div
                    key={item.id}
                    onPointerDown={() => handleItemPointerDown(item)}
                    onPointerUp={handleItemPointerUp}
                    onClick={() => handleOpenEdit(item)}
                    className="p-3.5 flex items-center gap-3.5 active:bg-neutral-50 transition-colors cursor-pointer select-none"
                  >
                    {/* Circular Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(item.id);
                      }}
                      className="w-5 h-5 rounded-full border-2 border-neutral-400 hover:border-neutral-600 active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      title="标记为完成"
                    />

                    {/* Content & Due Date */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-neutral-900 leading-snug break-words">
                        {item.title}
                      </p>
                      {dateInfo && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock
                            size={12}
                            className={
                              dateInfo.isOverdue
                                ? 'text-[#FF3B30] shrink-0'
                                : 'text-neutral-400 shrink-0'
                            }
                          />
                          <span
                            className={`text-[12px] font-medium font-mono ${
                              dateInfo.isOverdue
                                ? 'text-[#FF3B30]'
                                : 'text-neutral-500'
                            }`}
                          >
                            {dateInfo.isOverdue ? `已过期 · ${dateInfo.label}` : dateInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Section */}
        {completedList.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[13px] font-semibold text-neutral-500 tracking-tight">
                已完成 ({completedList.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowClearCompletedAlert(true)}
                className="text-[12px] text-red-500 hover:text-red-600 font-medium active:opacity-60 transition-opacity cursor-pointer px-1 py-0.5"
              >
                清除已完成
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.05]">
              {completedList.map((item) => {
                return (
                  <div
                    key={item.id}
                    onPointerDown={() => handleItemPointerDown(item)}
                    onPointerUp={handleItemPointerUp}
                    onClick={() => handleOpenEdit(item)}
                    className="p-3.5 flex items-center gap-3.5 active:bg-neutral-50 transition-colors cursor-pointer select-none opacity-75"
                  >
                    {/* Checked Circular Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(item.id);
                      }}
                      className="w-5 h-5 rounded-full bg-neutral-400 border-2 border-neutral-400 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer"
                      title="取消完成"
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>

                    {/* Strikethrough Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-normal text-neutral-400 line-through leading-snug break-words">
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM INPUT BAR ================= */}
      <div
        className="px-4 pt-2.5 bg-white/90 backdrop-blur-xl border-t border-black/[0.08] shrink-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        }}
      >
        {/* Optional Date Picker Row */}
        {showDatePicker && (
          <div className="mb-2 p-2.5 bg-neutral-100 rounded-xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Calendar size={15} className="text-neutral-500 shrink-0" />
              <input
                type="datetime-local"
                value={inputDueDate}
                onChange={(e) => setInputDueDate(e.target.value)}
                className="bg-transparent text-[13px] text-neutral-800 outline-none w-full font-mono"
              />
            </div>
            {inputDueDate && (
              <button
                type="button"
                onClick={() => setInputDueDate('')}
                className="text-[12px] text-neutral-500 hover:text-neutral-800 px-1 cursor-pointer"
              >
                清除时间
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Calendar Picker Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputDueDate || showDatePicker
                ? 'bg-[#5E5CE6] text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
            title="设置提醒时间"
          >
            <Clock size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddReminder();
              }
            }}
            placeholder="新提醒事项..."
            className="flex-1 h-9 px-3 text-[14px] bg-neutral-100 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-neutral-200/80 transition-colors"
          />

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddReminder}
            disabled={!inputText.trim()}
            className={`min-w-[48px] h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
              inputText.trim()
                ? 'bg-neutral-900 text-white active:scale-95 shadow-xs'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            添加
          </button>
        </div>
      </div>

      {/* ================= EDIT MODAL SHEET ================= */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="w-full bg-[#F2F2F7] rounded-t-[28px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 border-t border-white/40"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            {/* Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-neutral-300" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-black/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[15px] text-neutral-600 hover:text-black cursor-pointer"
              >
                取消
              </button>
              <h3 className="text-[16px] font-bold text-neutral-900">详细信息</h3>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="text-[15px] font-semibold text-neutral-900 hover:text-black cursor-pointer"
              >
                完成
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-2xl p-3 shadow-xs">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  事项内容
                </label>
                <textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="提醒事项内容..."
                  rows={3}
                  className="w-full text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-normal font-sans"
                />
              </div>

              <div className="bg-white rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#5E5CE6]" />
                    <span className="text-[14px] font-medium text-neutral-900">提醒时间</span>
                  </div>
                  {editDueDate && (
                    <button
                      type="button"
                      onClick={() => setEditDueDate('')}
                      className="text-[12px] text-red-500 hover:text-red-600 font-medium cursor-pointer"
                    >
                      移除时间
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 outline-none font-mono"
                />
              </div>

              {/* Red Delete Button in Edit Screen */}
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmItem(editingItem);
                }}
                className="w-full py-3 bg-white text-red-500 font-medium text-[15px] rounded-2xl shadow-xs active:bg-red-50 transition-colors text-center cursor-pointer"
              >
                删除提醒事项
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LONG-PRESS ACTION SHEET ================= */}
      {contextMenuItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setContextMenuItem(null)}
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
                onClick={() => handleOpenEdit(contextMenuItem)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-neutral-900 active:bg-neutral-100 cursor-pointer"
              >
                <span>编辑事项与时间</span>
                <Edit3 size={17} className="text-neutral-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmItem(contextMenuItem);
                  setContextMenuItem(null);
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-[#FF3B30] active:bg-red-50 cursor-pointer font-medium"
              >
                <span>删除提醒事项</span>
                <Trash2 size={17} className="text-[#FF3B30]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setContextMenuItem(null)}
              className="w-full py-3.5 bg-white rounded-2xl text-[16px] font-semibold text-neutral-800 active:bg-neutral-100 cursor-pointer text-center"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* ================= SECONDARY CONFIRMATION ALERTS ================= */}
      {/* 1. Delete Item Confirmation */}
      <IOSAlert
        isOpen={Boolean(deleteConfirmItem)}
        title="删除提醒事项"
        message="确定要删除该提醒事项吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmItem) {
            handleDeleteReminder(deleteConfirmItem.id);
          }
        }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      {/* 2. Clear Completed Confirmation */}
      <IOSAlert
        isOpen={showClearCompletedAlert}
        title="清除已完成事项"
        message={`确定要清除所有已完成的 ${completedList.length} 条提醒事项吗？此操作不可撤销。`}
        confirmText="清除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={handleClearCompleted}
        onCancel={() => setShowClearCompletedAlert(false)}
      />
    </div>
  );
};
