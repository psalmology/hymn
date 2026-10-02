import React, { useState, useMemo } from 'react';
import { Plus, Search, ChevronRight, ChevronLeft, Pin, MessageSquare, BookUser, Sparkles, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    personas,
    selectConversation,
    createNewConversationWithPersona,
    goHome,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  // Filter and sort conversations: Pinned first, then by updatedAt desc
  const filteredConversations = useMemo(() => {
    const list = conversations || [];
    const matched = !searchQuery.trim()
      ? list
      : list.filter((c) => {
          const q = searchQuery.toLowerCase();
          return (
            (c.remark || c.title || '').toLowerCase().includes(q) ||
            (c.messages || []).some((m) => (m.content || '').toLowerCase().includes(q))
          );
        });

    return [...matched].sort((a, b) => {
      const aPinned = a.settings?.isPinned ? 1 : 0;
      const bPinned = b.settings?.isPinned ? 1 : 0;
      if (aPinned !== bPinned) {
        return bPinned - aPinned; // Pinned goes first
      }
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });
  }, [conversations, searchQuery]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);

    if (diff < 1000 * 60) return '刚刚';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} 分钟前`;
    if (diff < 1000 * 60 * 60 * 24) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const handleSelectPersonaToStart = (personaId?: string) => {
    setShowPersonaPicker(false);
    createNewConversationWithPersona(personaId);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-8 mb-1">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1.5 cursor-pointer"
            title="返回桌面 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>返回</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPersonaPicker(true)}
            className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs cursor-pointer"
            title="新建对话"
          >
            <Plus size={17} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            聊天
          </h1>
          <span className="text-[12px] text-neutral-400 font-normal">
            {filteredConversations.length} 个对话
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
            placeholder="搜索对话或消息..."
            className="w-full h-9 pl-9 pr-3 text-[14px] bg-[#E3E3E8] rounded-xl text-neutral-900 placeholder:text-neutral-500 outline-none focus:bg-[#EAEAEF] focus:ring-1 focus:ring-black/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-300 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/[0.06]">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-500 mb-3">
              <MessageSquare size={28} />
            </div>
            <p className="text-[15px] font-medium text-neutral-600">
              {searchQuery ? '没有找到相关对话' : '暂无对话记录'}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1 max-w-[200px]">
              {searchQuery
                ? '换个关键词试一试'
                : '点击右上角「+」即可开启新的 AI 智能对话'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowPersonaPicker(true)}
                className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform cursor-pointer"
              >
                新建会话
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const lastMsg =
              conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;

            const previewText = lastMsg
              ? lastMsg.failed
                ? '⚠️ 发送失败'
                : lastMsg.content || '新消息'
              : '新会话，尚未发送消息';

            const displayTitle = conv.remark?.trim() || conv.title || '新会话';
            const isPinned = Boolean(conv.settings?.isPinned);
            const avatar = conv.avatarUrl || conv.settings?.avatarUrl;

            return (
              <div
                key={conv.id}
                className={`relative overflow-hidden transition-colors ${
                  isPinned ? 'bg-[#F9F9FB] active:bg-[#F2F2F5]' : 'bg-white active:bg-neutral-50'
                }`}
              >
                <div
                  className="flex items-center px-4 py-3.5 cursor-pointer"
                  onClick={() => selectConversation(conv.id)}
                >
                  {/* Left Avatar */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-[#3a3a3c] to-[#636366] text-white flex items-center justify-center shrink-0 shadow-xs mr-3">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[14px] font-bold tracking-tight">
                        {displayTitle.slice(0, 1) || 'AI'}
                      </span>
                    )}
                    {isPinned && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-2xs border border-white">
                        <Pin size={8} className="fill-white" />
                      </span>
                    )}
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                          {displayTitle}
                        </h3>
                        {isPinned && (
                          <span className="text-[10px] text-neutral-500 bg-neutral-200/80 px-1.5 py-0.2 rounded font-normal shrink-0">
                            置顶
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 font-normal shrink-0 ml-2">
                        {formatTimestamp(conv.updatedAt || conv.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] text-neutral-500 truncate leading-snug">
                      {previewText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Persona Picker Modal (Requirement 4.2) */}
      {showPersonaPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setShowPersonaPicker(false)}
        >
          <div
            className="w-full sm:max-w-[340px] max-h-[82vh] bg-white dark:bg-[#252528] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-neutral-900">
                  选择对话人设
                </h3>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  为新对话绑定一个人设或直接开启
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonaPicker(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Persona List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Option 1: 不使用人设 */}
              <button
                type="button"
                onClick={() => handleSelectPersonaToStart(undefined)}
                className="w-full p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200/80 transition-colors flex items-center gap-3 text-left border border-black/5 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-neutral-900 leading-tight">
                    不使用人设
                  </h4>
                  <p className="text-[12px] text-neutral-500 truncate mt-0.5">
                    标准通用智能对话，不附加特定角色设定
                  </p>
                </div>
                <ChevronRight size={16} className="text-neutral-400 shrink-0" />
              </button>

              {/* Option 2+: Personas from Library */}
              {personas.map((persona) => {
                const firstLine =
                  persona.description.split('\n').filter((l) => l.trim().length > 0)[0] ||
                  '暂无设定说明';

                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handleSelectPersonaToStart(persona.id)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center gap-3 text-left border border-black/[0.06] shadow-3xs cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3a3a3c] to-[#636366] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[14px] font-semibold">
                        {persona.name.slice(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold text-neutral-900 leading-tight">
                        {persona.name}
                      </h4>
                      <p className="text-[12px] text-neutral-500 truncate mt-0.5">
                        {firstLine}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Cancel Footer */}
            <div className="p-3 border-t border-black/[0.06] bg-[#F9F9FB]">
              <button
                type="button"
                onClick={() => setShowPersonaPicker(false)}
                className="w-full py-2.5 text-[14px] font-medium text-neutral-600 bg-white border border-black/10 rounded-xl active:bg-neutral-100 cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
