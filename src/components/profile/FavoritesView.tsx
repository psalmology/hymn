import React, { useState, useRef } from 'react';
import { ChevronLeft, Bookmark, Copy, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { FavoriteMessage } from '../../types';
import { IOSAlert } from '../common/IOSAlert';

export const FavoritesView: React.FC = () => {
  const { favorites, removeFavorite, setProfileSubView } = useChat();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unfavoriteItem, setUnfavoriteItem] = useState<FavoriteMessage | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('已复制到剪贴板');
  };

  const handlePointerDown = (fav: FavoriteMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setUnfavoriteItem(fav);
      longPressTimerRef.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${date} ${hours}:${mins}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-[13px] px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9 mb-1">
          <button
            type="button"
            onClick={() => setProfileSubView('main')}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
            <span>返回</span>
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            我的收藏
          </h1>
          <span className="text-[12px] text-neutral-400 font-normal">
            共 {favorites.length} 条
          </span>
        </div>
      </div>

      {/* Favorites List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {favorites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 pt-16">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-500 mb-3 shadow-3xs">
              <Bookmark size={26} strokeWidth={1.8} />
            </div>
            <p className="text-[15px] font-medium text-neutral-700">
              暂无收藏的消息
            </p>
            <p className="text-[12px] text-neutral-400 mt-1 max-w-[200px]">
              在聊天对话中长按任意气泡消息，点击「收藏」即可收录在此处
            </p>
          </div>
        ) : (
          favorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => handleCopy(fav.content)}
              onPointerDown={() => handlePointerDown(fav)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={(e) => {
                e.preventDefault();
                setUnfavoriteItem(fav);
              }}
              className="bg-white rounded-2xl p-3.5 border border-black/[0.06] shadow-xs active:bg-neutral-50 transition-colors cursor-pointer group"
            >
              {/* Header row: Character name + Time */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                  {fav.characterName || 'AI 角色'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {formatTime(fav.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              <p className="text-[14px] text-neutral-900 leading-relaxed whitespace-pre-wrap break-words">
                {fav.content}
              </p>

              <div className="mt-2 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Copy size={11} /> 点击复制
                </span>
                <span className="flex items-center gap-1 text-neutral-400 group-hover:text-red-500 transition-colors">
                  <Trash2 size={11} /> 长按取消收藏
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unfavorite Alert */}
      <IOSAlert
        isOpen={Boolean(unfavoriteItem)}
        title="取消收藏"
        message="确定要将这条消息从我的收藏中移除吗？"
        confirmText="移除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (unfavoriteItem) {
            removeFavorite(unfavoriteItem.messageId);
            showToast('已取消收藏');
          }
          setUnfavoriteItem(null);
        }}
        onCancel={() => setUnfavoriteItem(null)}
      />
    </div>
  );
};
