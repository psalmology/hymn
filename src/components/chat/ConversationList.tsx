import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  Pin,
  MessageSquare,
  UserPlus,
  Users,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { UserAccount } from '../../types';
import { AddFriendModal } from './AddFriendModal';
import { CreateAltModal } from './CreateAltModal';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    currentAccount,
    selectConversation,
    goHome,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [targetAccountForAdd, setTargetAccountForAdd] = useState<UserAccount | undefined>(undefined);
  const [headerSubtitleForAdd, setHeaderSubtitleForAdd] = useState<string | undefined>(undefined);
  const [showCreateAltModal, setShowCreateAltModal] = useState(false);

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

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none relative">
      {/* Top Header */}
      <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9 mb-1 relative">
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
            onClick={() => setShowMenu((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-900 cursor-pointer"
            title="更多选项"
          >
            <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs">
              <Plus size={17} strokeWidth={2.5} />
            </span>
          </button>

          {/* iOS-Style Dropdown Menu under '+' */}
          {showMenu && (
            <>
              {/* Tap outside backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />

              <div
                className="absolute right-0 top-10 z-50 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-black/[0.08] overflow-hidden py-1 divide-y divide-black/[0.06] animate-in fade-in zoom-in-95 origin-top-right duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. 添加好友: 用当前账号添加 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setTargetAccountForAdd(currentAccount);
                    setHeaderSubtitleForAdd(undefined);
                    setShowAddFriendModal(true);
                  }}
                  className="w-full px-3.5 py-3 flex items-center gap-3 text-left hover:bg-neutral-100/70 active:bg-neutral-200/60 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-neutral-200 transition-colors">
                    <UserPlus size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-900 leading-tight">
                      添加好友
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      用当前账号添加
                    </div>
                  </div>
                </button>

                {/* 2. 创建小号添加好友 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowCreateAltModal(true);
                  }}
                  className="w-full px-3.5 py-3 flex items-center gap-3 text-left hover:bg-neutral-100/70 active:bg-neutral-200/60 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-neutral-200 transition-colors">
                    <Users size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-900 leading-tight">
                      创建小号添加好友
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      先建小号，再加好友
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
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
                onClick={() => {
                  setTargetAccountForAdd(currentAccount);
                  setHeaderSubtitleForAdd(undefined);
                  setShowAddFriendModal(true);
                }}
                className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform cursor-pointer"
              >
                添加好友
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

            const firstLetter = (conv.remark || conv.title || '角').slice(0, 1);
            const isPinned = conv.settings?.isPinned === true;

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`p-3.5 flex items-center gap-3 active:bg-neutral-200/60 transition-colors cursor-pointer select-none relative ${
                  isPinned ? 'bg-neutral-100/70' : 'bg-transparent'
                }`}
              >
                {/* Pinned visual icon */}
                {isPinned && (
                  <div className="absolute top-2 right-2 text-neutral-400">
                    <Pin size={12} className="rotate-45 fill-neutral-400" />
                  </div>
                )}

                {/* Avatar with Squircle styling */}
                <div className="w-12 h-12 rounded-[22%] overflow-hidden bg-[#D4D5DC] flex items-center justify-center shrink-0 border border-black/[0.06] shadow-2xs">
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[18px] font-bold text-neutral-700">
                      {firstLetter}
                    </span>
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-neutral-900 truncate">
                      {conv.remark || conv.title}
                    </h3>
                    <span className="text-[12px] text-neutral-400 shrink-0 ml-2">
                      {formatTimestamp(conv.updatedAt || conv.createdAt)}
                    </span>
                  </div>

                  <p className="text-[13px] text-neutral-500 truncate mt-0.5 leading-normal">
                    {previewText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= ADD FRIEND MODAL ================= */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        targetAccount={targetAccountForAdd}
        headerSubtitle={headerSubtitleForAdd}
        onClose={() => {
          setShowAddFriendModal(false);
          setTargetAccountForAdd(undefined);
          setHeaderSubtitleForAdd(undefined);
        }}
      />

      {/* ================= CREATE ALT MODAL (FLOW 2: 先创建小号再加好友) ================= */}
      <CreateAltModal
        isOpen={showCreateAltModal}
        mode="add_friend_flow"
        onClose={() => setShowCreateAltModal(false)}
        onNextStep={(createdAccount) => {
          setShowCreateAltModal(false);
          setTargetAccountForAdd(createdAccount);
          setHeaderSubtitleForAdd(`为【${createdAccount.nickname}】添加好友`);
          setShowAddFriendModal(true);
        }}
      />
    </div>
  );
};
