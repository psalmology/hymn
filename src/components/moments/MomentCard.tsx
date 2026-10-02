import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Moment, MomentComment } from '../../types';
import { IOSAlert } from '../common/IOSAlert';

interface MomentCardProps {
  moment: Moment;
  onLike: (momentId: string) => void;
  onStartComment: (momentId: string, replyToName?: string, replyToAuthorId?: string) => void;
  onDeleteMoment: (momentId: string) => void;
  onDeleteComment: (momentId: string, commentId: string) => void;
  onOpenImage: (imageUrl: string) => void;
}

export const MomentCard: React.FC<MomentCardProps> = ({
  moment,
  onLike,
  onStartComment,
  onDeleteMoment,
  onDeleteComment,
  onOpenImage,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteMomentAlert, setShowDeleteMomentAlert] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<MomentComment | null>(null);

  const longPressMomentTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressCommentTimer = useRef<NodeJS.Timeout | null>(null);

  const isLikedByMe = moment.likes.some((l) => l.authorId === 'user');

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const handlePointerDownMoment = () => {
    longPressMomentTimer.current = setTimeout(() => {
      setShowDeleteMomentAlert(true);
      longPressMomentTimer.current = null;
    }, 600);
  };

  const handlePointerUpMoment = () => {
    if (longPressMomentTimer.current) {
      clearTimeout(longPressMomentTimer.current);
      longPressMomentTimer.current = null;
    }
  };

  const handlePointerDownComment = (comment: MomentComment) => {
    if (comment.authorId !== 'user') return;
    longPressCommentTimer.current = setTimeout(() => {
      setDeleteCommentTarget(comment);
      longPressCommentTimer.current = null;
    }, 500);
  };

  const handlePointerUpComment = () => {
    if (longPressCommentTimer.current) {
      clearTimeout(longPressCommentTimer.current);
      longPressCommentTimer.current = null;
    }
  };

  const firstLetter = moment.authorName.slice(0, 1) || '友';

  return (
    <div
      onPointerDown={handlePointerDownMoment}
      onPointerUp={handlePointerUpMoment}
      onPointerCancel={handlePointerUpMoment}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowDeleteMomentAlert(true);
      }}
      className="p-4 bg-white border-b border-black/[0.06] flex items-start gap-3 relative select-none hover:bg-neutral-50/50 transition-colors"
    >
      {/* Left Avatar: Small rounded square avatar */}
      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#D4D5DC] flex items-center justify-center shrink-0 border border-black/5 shadow-2xs font-semibold text-[15px] text-neutral-700">
        {moment.authorAvatar ? (
          <img
            src={moment.authorAvatar}
            alt={moment.authorName}
            className="w-full h-full object-cover"
          />
        ) : (
          firstLetter
        )}
      </div>

      {/* Right Column Content */}
      <div className="flex-1 min-w-0 pr-0.5">
        {/* Author Name */}
        <h4 className="text-[15px] font-bold text-neutral-800 leading-snug">
          {moment.authorName}
        </h4>

        {/* Text Content */}
        {moment.content && (
          <p className="text-[14px] text-neutral-900 leading-relaxed mt-1 whitespace-pre-wrap break-words">
            {moment.content}
          </p>
        )}

        {/* Images Grid (up to 9 images) */}
        {moment.images && moment.images.length > 0 && (
          <div
            className={`mt-2 gap-1.5 grid ${
              moment.images.length === 1
                ? 'grid-cols-1 max-w-[200px]'
                : moment.images.length === 4
                ? 'grid-cols-2 max-w-[220px]'
                : 'grid-cols-3 max-w-[260px]'
            }`}
          >
            {moment.images.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenImage(imgUrl);
                }}
                className={`overflow-hidden rounded-lg bg-neutral-100 border border-black/5 cursor-pointer active:opacity-80 transition-opacity ${
                  moment.images.length === 1 ? 'max-h-56' : 'aspect-square'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Moment media ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom Bar: Timestamp & "··" Action Menu Button */}
        <div className="mt-2.5 flex items-center justify-between text-[12px] text-neutral-400 relative">
          <span>{formatTimestamp(moment.createdAt)}</span>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowActionMenu((prev) => !prev);
              }}
              className="w-8 h-5 rounded-md bg-[#ECECF0] hover:bg-[#E2E2E6] flex items-center justify-center text-neutral-700 active:scale-95 transition-all cursor-pointer font-bold leading-none"
              title="操作"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* iOS Floating Capsule Menu */}
            {showActionMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionMenu(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-9 -top-2 z-40 bg-[#3A3A3C] text-white rounded-xl shadow-xl flex items-center divide-x divide-white/15 animate-in fade-in slide-in-from-right-2 duration-150 py-1.5 px-1 whitespace-nowrap text-[12px] font-medium"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      onLike(moment.id);
                    }}
                    className="px-3 py-1 flex items-center gap-1.5 hover:text-white/80 active:opacity-60 cursor-pointer"
                  >
                    <Heart
                      size={13}
                      className={isLikedByMe ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                    <span>{isLikedByMe ? '取消赞' : '点赞'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      onStartComment(moment.id);
                    }}
                    className="px-3 py-1 flex items-center gap-1.5 hover:text-white/80 active:opacity-60 cursor-pointer"
                  >
                    <MessageCircle size={13} />
                    <span>评论</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Likes & Comments Box (Gray Container) */}
        {(moment.likes.length > 0 || moment.comments.length > 0) && (
          <div className="mt-2.5 bg-[#F2F2F7] rounded-xl p-2.5 text-[12px] space-y-1.5 border border-black/[0.03]">
            {/* Likes Row */}
            {moment.likes.length > 0 && (
              <div className="flex items-start gap-1.5 text-neutral-700 leading-relaxed pb-1 border-b border-black/[0.04]">
                <Heart size={13} className="text-red-500 fill-red-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-neutral-800">
                  {moment.likes.map((l) => l.authorName).join('、')}
                </span>
              </div>
            )}

            {/* Comments List */}
            {moment.comments.map((c) => {
              const isMine = c.authorId === 'user';
              return (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMine) {
                      onStartComment(moment.id, c.authorName, c.authorId);
                    }
                  }}
                  onPointerDown={() => handlePointerDownComment(c)}
                  onPointerUp={handlePointerUpComment}
                  onPointerCancel={handlePointerUpComment}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isMine) setDeleteCommentTarget(c);
                  }}
                  className="leading-snug break-words cursor-pointer hover:bg-black/[0.03] p-0.5 rounded transition-colors group"
                >
                  <span className="font-semibold text-neutral-800">
                    {c.authorName}
                  </span>
                  {c.replyToName && (
                    <span className="text-neutral-500 font-normal">
                      {' '}回复{' '}
                      <span className="font-semibold text-neutral-700">
                        {c.replyToName}
                      </span>
                    </span>
                  )}
                  <span className="text-neutral-800 font-medium">：</span>
                  <span className="text-neutral-700">{c.content}</span>
                  {isMine && (
                    <span className="text-[10px] text-neutral-400 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      (长按可删除)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Moment Alert */}
      <IOSAlert
        isOpen={showDeleteMomentAlert}
        title="删除动态"
        message="确定要删除这条动态吗？删除后不可恢复。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          onDeleteMoment(moment.id);
          setShowDeleteMomentAlert(false);
        }}
        onCancel={() => setShowDeleteMomentAlert(false)}
      />

      {/* Delete Comment Alert */}
      <IOSAlert
        isOpen={Boolean(deleteCommentTarget)}
        title="删除评论"
        message="确定要删除您的这条评论吗？"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (deleteCommentTarget) {
            onDeleteComment(moment.id, deleteCommentTarget.id);
            setDeleteCommentTarget(null);
          }
        }}
        onCancel={() => setDeleteCommentTarget(null)}
      />
    </div>
  );
};
