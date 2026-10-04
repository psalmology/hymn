import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Send,
  Plane,
  AlertCircle,
  RotateCcw,
  Settings as SettingsIcon,
  Copy,
  CornerDownLeft,
  Edit3,
  Trash2,
  CheckSquare,
  Check,
  X,
  Bookmark,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatMessage, ChatQuote } from '../../types';
import { IOSAlert } from '../common/IOSAlert';

export const ChatRoom: React.FC = () => {
  const {
    currentConversation,
    setChatSubView,
    sendMessage,
    postUserMessageOnly,
    triggerAiReply,
    retryFailedMessage,
    editMessageContent,
    deleteSingleMessage,
    deleteMultipleMessages,
    isGenerating,
    activeProfile,
    openApp,
    setSettingsSubView,
    chatTheme,
    addFavorite,
    removeFavorite,
    isMessageFavorited,
  } = useChat();

  const [inputText, setInputText] = useState('');

  // Context Menu State
  const [activeMenu, setActiveMenu] = useState<{
    msg: ChatMessage;
    x: number;
    y: number;
  } | null>(null);

  // Quote State
  const [quotedMessage, setQuotedMessage] = useState<ChatQuote | null>(null);

  // Inline Message Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Multi-select State
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // Alert Dialogs
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [showMultiDeleteAlert, setShowMultiDeleteAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoReply = currentConversation?.settings?.autoReplyOnSend !== false;
  const customBg = currentConversation?.settings?.chatBackground || chatTheme.globalBackground || '#F2F2F7';

  const fontSizeClass =
    chatTheme.fontSize === 'small'
      ? 'text-[13px]'
      : chatTheme.fontSize === 'large'
      ? 'text-[17px]'
      : 'text-[15px]';

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 1800);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    try {
      if (!isMultiSelect && messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // Ignore scroll failure
    }
  }, [currentConversation?.messages?.length, isGenerating, isMultiSelect]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        96
      )}px`;
    }
  }, [inputText]);

  // Long press timer handlers (0.5s duration)
  const startLongPress = (msg: ChatMessage, e: React.MouseEvent | React.TouchEvent) => {
    if (isMultiSelect || editingMessageId) return;
    clearLongPress();

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
      setActiveMenu({
        msg,
        x: clientX,
        y: clientY,
      });
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (msg: ChatMessage, e: React.MouseEvent) => {
    e.preventDefault();
    if (isMultiSelect || editingMessageId) return;
    clearLongPress();
    setActiveMenu({
      msg,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Menu action: Copy
  const handleMenuCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setActiveMenu(null);
    showToast('已复制');
  };

  // Menu action: Quote
  const handleMenuQuote = (msg: ChatMessage) => {
    setQuotedMessage({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    });
    setActiveMenu(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Menu action: Edit
  const handleMenuEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
    setActiveMenu(null);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!currentConversation) return;
    if (editingText.trim()) {
      editMessageContent(currentConversation.id, msgId, editingText.trim());
    }
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Menu action: Delete Single
  const handleMenuDelete = (msg: ChatMessage) => {
    setActiveMenu(null);
    setSingleDeleteId(msg.id);
  };

  // Menu action: Enter Multi-select
  const handleMenuMultiSelect = (msg: ChatMessage) => {
    setActiveMenu(null);
    setIsMultiSelect(true);
    setSelectedMessageIds([msg.id]);
  };

  const toggleSelectMessage = (msgId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  // Multi-select: Copy selected
  const handleMultiCopy = () => {
    if (!currentConversation || selectedMessageIds.length === 0) return;
    const selectedMsgs = currentConversation.messages.filter((m) =>
      selectedMessageIds.includes(m.id)
    );
    const text = selectedMsgs
      .map((m) => {
        const sender = m.role === 'user' ? '我' : characterDisplayName;
        return `${sender}: ${m.content}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('已复制所选消息');
    setIsMultiSelect(false);
    setSelectedMessageIds([]);
  };

  // Multi-select: Delete selected
  const handleMultiDeleteConfirm = () => {
    if (!currentConversation || selectedMessageIds.length === 0) return;
    deleteMultipleMessages(currentConversation.id, selectedMessageIds);
    setShowMultiDeleteAlert(false);
    setIsMultiSelect(false);
    setSelectedMessageIds([]);
  };

  // Send button handler
  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    const quoteToSend = quotedMessage;
    setInputText('');
    setQuotedMessage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (autoReply) {
      if (isGenerating) return;
      sendMessage(text, quoteToSend || undefined);
    } else {
      postUserMessageOnly(text, quoteToSend || undefined);
    }
  };

  // Airplane button handler
  const handleAirplaneTrigger = async () => {
    if (isGenerating) return;

    if (inputText.trim()) {
      const text = inputText;
      const quoteToSend = quotedMessage;
      setInputText('');
      setQuotedMessage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await sendMessage(text, quoteToSend || undefined);
    } else {
      await triggerAiReply();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine character remark or original title (Requirement 2: Only show remark, no "原名: xxx")
  const originalTitle = currentConversation?.title || '新对话';
  const remarkName = currentConversation?.remark?.trim();
  const characterDisplayName = remarkName || originalTitle;

  // Title text: when AI is generating, it temporarily becomes "正在输入中…", otherwise characterDisplayName
  const currentTitle = isGenerating ? '正在输入中…' : characterDisplayName;

  const messages = currentConversation?.messages || [];
  const hasValidProfile = Boolean(activeProfile && activeProfile.apiKey?.trim());

  return (
    <div
      className="w-full h-full flex flex-col select-none transition-colors duration-200"
      style={{ backgroundColor: customBg || '#F2F2F7' }}
      onClick={() => {
        if (activeMenu) setActiveMenu(null);
      }}
    >
      {/* Navigation Header - status bar space reserved */}
      <div className="ios-safe-header px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          {/* Left: ‹ 聊天 or 取消 (in multi-select) with >=44x44 touch hitbox and >=12px left margin */}
          {isMultiSelect ? (
            <button
              type="button"
              onClick={() => {
                setIsMultiSelect(false);
                setSelectedMessageIds([]);
              }}
              className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity shrink-0 pr-2 cursor-pointer"
            >
              取消
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setChatSubView('list')}
              className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity shrink-0 pr-2 cursor-pointer"
            >
              <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
              <span>聊天</span>
            </button>
          )}

          {/* Center: Title / Character Remark Name (purely display-only, cannot be edited here) */}
          <div className="flex-1 text-center px-2 min-w-0 select-none flex items-center justify-center gap-1.5">
            {!isMultiSelect && (currentConversation?.avatarUrl || currentConversation?.settings?.avatarUrl) && (
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-black/10">
                <img
                  src={currentConversation.avatarUrl || currentConversation.settings?.avatarUrl}
                  alt={currentTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h2
              className={`text-[15px] font-semibold tracking-tight truncate ${
                isGenerating ? 'text-neutral-700 animate-pulse' : 'text-neutral-900'
              }`}
            >
              {isMultiSelect ? `已选择 ${selectedMessageIds.length} 条` : currentTitle}
            </h2>
          </div>

          {/* Right: Settings gear or Select All with >=44x44 touch hitbox */}
          {isMultiSelect ? (
            <button
              type="button"
              onClick={() => {
                if (selectedMessageIds.length === messages.length) {
                  setSelectedMessageIds([]);
                } else {
                  setSelectedMessageIds(messages.map((m) => m.id));
                }
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[14px] text-neutral-700 hover:text-black font-medium cursor-pointer shrink-0 pl-2"
            >
              {selectedMessageIds.length === messages.length ? '全不选' : '全选'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setChatSubView('settings')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-600 hover:text-neutral-900 active:scale-95 transition-all cursor-pointer shrink-0 pl-2"
              title="角色聊天设置"
            >
              <SettingsIcon size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
        {!hasValidProfile && (
          <div className="p-3 bg-neutral-200/70 border border-neutral-300/80 rounded-2xl flex items-start gap-2.5 shadow-2xs">
            <AlertCircle size={16} className="text-neutral-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-[12px] text-neutral-700 leading-snug">
              <span className="font-semibold block mb-0.5">
                请先到设置中添加 API
              </span>
              尚未配置可用的 API Key。请前往「设置」配置或切换您的自定义 API。
              <button
                type="button"
                onClick={() => {
                  openApp('settings');
                  setSettingsSubView('api');
                }}
                className="block mt-1 font-medium underline text-neutral-900 cursor-pointer"
              >
                前往「设置」配置 API →
              </button>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-neutral-400 select-none">
            <div className="w-12 h-12 rounded-2xl bg-neutral-200/90 text-neutral-600 flex items-center justify-center mb-2.5 shadow-xs">
              <span className="text-lg font-bold">AI</span>
            </div>
            <p className="text-[14px] font-medium text-neutral-700">开始与 {characterDisplayName} 对话</p>
            <p className="text-[12px] text-neutral-400 mt-1 max-w-[220px]">
              {activeProfile
                ? `当前使用「${activeProfile.name}」，输入即可发送。`
                : '输入您的问题，系统将自动向配置的 API 发起请求。'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isEditing = editingMessageId === msg.id;
            const isSelected = selectedMessageIds.includes(msg.id);

            if (msg.failed) {
              return (
                <div key={msg.id} className="flex flex-col items-start max-w-[90%]">
                  <div className="p-3 rounded-2xl rounded-bl-xs bg-red-50/90 border border-red-200/80 text-red-900 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[13px] text-red-700 mb-1">
                      <AlertCircle size={14} />
                      <span>请求失败</span>
                    </div>
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap break-words text-red-800">
                      {msg.error || '调用大模型服务时发生异常。'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-red-200/60 text-[11px]">
                      <button
                        type="button"
                        onClick={() => retryFailedMessage(msg.id)}
                        className="flex items-center gap-1 font-medium text-red-700 hover:text-red-900 active:scale-95 transition-transform cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>重试此消息</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openApp('settings');
                          setSettingsSubView('api');
                        }}
                        className="font-medium text-neutral-700 hover:underline cursor-pointer"
                      >
                        检查 API 设置
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 transition-all ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
                onClick={() => {
                  if (isMultiSelect) {
                    toggleSelectMessage(msg.id);
                  }
                }}
              >
                {/* Multi-select round checkbox */}
                {isMultiSelect && (
                  <div className="pt-2 shrink-0 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-neutral-900 border-neutral-900 text-white'
                          : 'border-neutral-400 bg-white/80'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  onMouseDown={(e) => startLongPress(msg, e)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onTouchStart={(e) => startLongPress(msg, e)}
                  onTouchEnd={clearLongPress}
                  onTouchMove={clearLongPress}
                  onContextMenu={(e) => handleContextMenu(msg, e)}
                  className={`relative max-w-[85%] transition-all cursor-pointer ${
                    activeMenu?.msg.id === msg.id ? 'scale-102 shadow-md' : ''
                  }`}
                >
                  {isEditing ? (
                    /* Inline Message Editor */
                    <div className="bg-white rounded-2xl p-2.5 shadow-md border border-neutral-300 min-w-[240px]">
                      <textarea
                        autoFocus
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full text-[14px] text-neutral-900 bg-[#EFEFF4] rounded-xl p-2 outline-none resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-black/5 text-[12px]">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-neutral-600 rounded-lg active:bg-neutral-100"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-3 py-1 bg-neutral-900 text-white font-medium rounded-lg active:scale-95"
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Bubble (No hover buttons shown at any time) */
                    <div
                      className={`px-3.5 py-2.5 ${fontSizeClass} leading-relaxed break-words rounded-2xl shadow-xs transition-shadow border ${
                        isUser
                          ? 'rounded-br-xs border-transparent'
                          : 'rounded-bl-xs border-black/5'
                      }`}
                      style={{
                        backgroundColor: isUser
                          ? chatTheme.userBubbleColor
                          : chatTheme.assistantBubbleColor,
                        color: isUser
                          ? chatTheme.userBubbleColor === '#C7C7CC'
                            ? '#1C1C1E'
                            : '#FFFFFF'
                          : chatTheme.assistantBubbleColor === '#AEAEB2'
                          ? '#FFFFFF'
                          : '#1C1C1E',
                      }}
                    >
                      {/* Quoted message reference in bubble if present */}
                      {msg.quote && (
                        <div
                          className={`text-[12px] opacity-80 border-l-2 pl-2 mb-1.5 leading-snug line-clamp-2 select-none ${
                            isUser ? 'border-neutral-400' : 'border-neutral-600'
                          }`}
                        >
                          <span className="font-semibold block text-[10px] opacity-75">
                            {msg.quote.role === 'user' ? '引用我的消息' : '引用回复'}
                          </span>
                          <span className="italic">“{msg.quote.content}”</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Message Preview Bar above input box */}
      {!isMultiSelect && quotedMessage && (
        <div className="px-3.5 py-1.5 bg-neutral-200/90 backdrop-blur-md border-t border-black/[0.06] flex items-center justify-between text-[12px] animate-in slide-in-from-bottom-2 duration-150 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-1 h-7 bg-neutral-600 rounded-full shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-neutral-800 block leading-tight">
                引用 {quotedMessage.role === 'user' ? '我的消息' : characterDisplayName}
              </span>
              <p className="text-neutral-600 truncate leading-snug">
                {quotedMessage.content}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuotedMessage(null)}
            className="p-1 text-neutral-400 hover:text-neutral-700 active:scale-95 transition-all cursor-pointer rounded-full"
            title="取消引用"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bottom Sticky Bar: Normal Input Bar OR Multi-select Action Bar */}
      {isMultiSelect ? (
        /* Multi-select Action Bar */
        <div
          className="px-4 pt-2.5 border-t border-black/[0.08] shrink-0 flex items-center justify-between transition-colors duration-200"
          style={{
            backgroundColor: customBg || '#F2F2F7',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          }}
        >
          <button
            type="button"
            disabled={selectedMessageIds.length === 0}
            onClick={handleMultiCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-medium transition-all ${
              selectedMessageIds.length > 0
                ? 'bg-neutral-800 text-white active:scale-95 cursor-pointer shadow-2xs'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Copy size={15} />
            <span>复制 ({selectedMessageIds.length})</span>
          </button>

          <button
            type="button"
            disabled={selectedMessageIds.length === 0}
            onClick={() => setShowMultiDeleteAlert(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold transition-all ${
              selectedMessageIds.length > 0
                ? 'bg-[#FF3B30] text-white active:scale-95 cursor-pointer shadow-2xs'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={15} />
            <span>删除 ({selectedMessageIds.length})</span>
          </button>
        </div>
      ) : (
        /* Standard Bottom Sticky Input Bar (flush against bottom, background extends to bottom) */
        <div
          className="px-3 pt-2 border-t border-black/[0.08] shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: customBg || '#F2F2F7',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          }}
        >
          <div className="flex items-end gap-1.5 bg-[#E4E4E9] rounded-2xl px-2.5 py-1.5 focus-within:bg-[#EDEDF2] focus-within:ring-1 focus-within:ring-black/20 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 250);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                hasValidProfile ? '发消息...' : '请先在「设置」中添加并配置 API...'
              }
              className="flex-1 max-h-24 py-1.5 text-[15px] bg-transparent text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-snug"
            />

            {/* Airplane Button (小飞机按钮: 让 AI 开始回复) */}
            <button
              type="button"
              disabled={isGenerating || (!inputText.trim() && messages.length === 0)}
              onClick={handleAirplaneTrigger}
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer ${
                !isGenerating && (inputText.trim() || messages.length > 0)
                  ? 'bg-neutral-700 hover:bg-neutral-800 text-white shadow-2xs active:scale-90'
                  : 'bg-neutral-300/80 text-neutral-400 cursor-not-allowed'
              }`}
              title={
                isGenerating
                  ? 'AI 正在回复中…'
                  : inputText.trim()
                  ? '发送并让 AI 回复'
                  : '让 AI 根据当前聊天记录回复'
              }
            >
              <Plane size={14} className="-rotate-45" />
            </button>

            {/* Send Button (发送按钮) */}
            <button
              type="button"
              disabled={!inputText.trim() || (isGenerating && autoReply)}
              onClick={handleSend}
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer ${
                inputText.trim() && !(isGenerating && autoReply)
                  ? 'bg-neutral-900 text-white shadow-xs active:scale-90'
                  : 'bg-neutral-300 text-neutral-400 cursor-not-allowed'
              }`}
              title={autoReply ? '发送并立即回复' : '发送消息（不触发回复）'}
            >
              <Send size={13} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Style Long-Press Context Menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-100"
          onClick={() => setActiveMenu(null)}
        >
          <div
            className="w-56 bg-white/95 dark:bg-[#252528]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden divide-y divide-black/[0.06] text-[15px] animate-in zoom-in-95 duration-150 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. 复制 */}
            <button
              type="button"
              onClick={() => handleMenuCopy(activeMenu.msg)}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-800 hover:bg-neutral-100/80 active:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <span>复制</span>
              <Copy size={16} className="text-neutral-500" />
            </button>

            {/* 2. 引用 */}
            <button
              type="button"
              onClick={() => handleMenuQuote(activeMenu.msg)}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-800 hover:bg-neutral-100/80 active:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <span>引用</span>
              <CornerDownLeft size={16} className="text-neutral-500" />
            </button>

            {/* 3. 收藏 / 取消收藏 */}
            <button
              type="button"
              onClick={() => {
                if (!currentConversation) return;
                const isFav = isMessageFavorited(activeMenu.msg.id);
                if (isFav) {
                  removeFavorite(activeMenu.msg.id);
                  showToast('已取消收藏');
                } else {
                  addFavorite({
                    messageId: activeMenu.msg.id,
                    conversationId: currentConversation.id,
                    characterName: characterDisplayName,
                    content: activeMenu.msg.content,
                    timestamp: activeMenu.msg.timestamp || Date.now(),
                  });
                  showToast('已收藏');
                }
                setActiveMenu(null);
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-800 hover:bg-neutral-100/80 active:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <span>{isMessageFavorited(activeMenu.msg.id) ? '取消收藏' : '收藏'}</span>
              <Bookmark
                size={16}
                className={
                  isMessageFavorited(activeMenu.msg.id)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-neutral-500'
                }
              />
            </button>

            {/* 4. 编辑 */}
            <button
              type="button"
              onClick={() => handleMenuEdit(activeMenu.msg)}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-800 hover:bg-neutral-100/80 active:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <span>编辑</span>
              <Edit3 size={16} className="text-neutral-500" />
            </button>

            {/* 4. 删除 */}
            <button
              type="button"
              onClick={() => handleMenuDelete(activeMenu.msg)}
              className="w-full px-4 py-3 flex items-center justify-between text-[#FF3B30] hover:bg-red-50/80 active:bg-red-100/80 transition-colors cursor-pointer"
            >
              <span>删除</span>
              <Trash2 size={16} className="text-[#FF3B30]" />
            </button>

            {/* 5. 多选 */}
            <button
              type="button"
              onClick={() => handleMenuMultiSelect(activeMenu.msg)}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-800 hover:bg-neutral-100/80 active:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <span>多选</span>
              <CheckSquare size={16} className="text-neutral-500" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-[13px] px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Single Message Delete Confirmation Alert */}
      <IOSAlert
        isOpen={Boolean(singleDeleteId)}
        title="删除消息"
        message="确定要删除这条消息吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (singleDeleteId && currentConversation) {
            deleteSingleMessage(currentConversation.id, singleDeleteId);
          }
          setSingleDeleteId(null);
        }}
        onCancel={() => setSingleDeleteId(null)}
      />

      {/* Multi-Message Delete Confirmation Alert */}
      <IOSAlert
        isOpen={showMultiDeleteAlert}
        title="删除选中的消息"
        message={`确定要删除选中的 ${selectedMessageIds.length} 条消息吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={handleMultiDeleteConfirm}
        onCancel={() => setShowMultiDeleteAlert(false)}
      />
    </div>
  );
};
