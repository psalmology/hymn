import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, Image as ImageIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MomentCard } from './MomentCard';
import { PublishMomentModal } from './PublishMomentModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { IOSAlert } from '../common/IOSAlert';

interface MomentsViewProps {
  isMyProfileOnly?: boolean;
  onBackToProfile?: () => void;
}

// Compress cover image (max 1000px, 0.82)
function compressCoverImage(file: File, maxDim: number = 1000, quality: number = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  isMyProfileOnly = false,
  onBackToProfile,
}) => {
  const {
    moments,
    momentsCoverUrl,
    setMomentsCoverUrl,
    userProfile,
    publishMoment,
    deleteMoment,
    toggleLikeMoment,
    addCommentToMoment,
    deleteCommentFromMoment,
    goHome,
  } = useChat();

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [showCoverMenu, setShowCoverMenu] = useState(false);

  // Active Commenting State
  const [commentingState, setCommentingState] = useState<{
    momentId: string;
    replyToName?: string;
    replyToAuthorId?: string;
  } | null>(null);
  const [commentInputText, setCommentInputText] = useState('');

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const longPressCoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Filter moments if in "My Profile Only" mode
  const displayedMoments = isMyProfileOnly
    ? moments.filter((m) => m.isUser)
    : moments;

  // Handle Cover long press
  const handlePointerDownCover = () => {
    longPressCoverTimer.current = setTimeout(() => {
      setShowCoverMenu(true);
      longPressCoverTimer.current = null;
    }, 500);
  };

  const handlePointerUpCover = () => {
    if (longPressCoverTimer.current) {
      clearTimeout(longPressCoverTimer.current);
      longPressCoverTimer.current = null;
    }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressCoverImage(file, 1000, 0.82);
      setMomentsCoverUrl(compressed);
    } catch (err) {
      console.error('Failed to compress cover image', err);
    }
    e.target.value = '';
  };

  const handleStartComment = (
    momentId: string,
    replyToName?: string,
    replyToAuthorId?: string
  ) => {
    setCommentingState({ momentId, replyToName, replyToAuthorId });
    setCommentInputText('');
  };

  const handleSubmitComment = () => {
    if (!commentingState || !commentInputText.trim()) return;
    addCommentToMoment(
      commentingState.momentId,
      commentInputText.trim(),
      commentingState.replyToName,
      commentingState.replyToAuthorId
    );
    setCommentingState(null);
    setCommentInputText('');
  };

  const handleBack = () => {
    if (isMyProfileOnly && onBackToProfile) {
      onBackToProfile();
    } else {
      goHome();
    }
  };

  const firstLetter = (userProfile.nickname?.trim() || '我').slice(0, 1);

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none relative">
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFileChange}
      />

      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20 shrink-0">
        <div className="flex items-center justify-between h-8 mb-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1.5 cursor-pointer"
            title="返回 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>返回</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-95 transition-transform shadow-xs cursor-pointer -mr-1"
            title="发布动态"
          >
            <Camera size={17} />
          </button>
        </div>

        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          Moments
        </h1>
      </div>

      {/* Scrollable Feed Container */}
      <div className="flex-1 overflow-y-auto pb-12">
        {/* Cover Section: Grayscale gradient background or custom cover image */}
        <div
          onPointerDown={handlePointerDownCover}
          onPointerUp={handlePointerUpCover}
          onPointerCancel={handlePointerUpCover}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowCoverMenu(true);
          }}
          className="relative h-48 w-full bg-cover bg-center overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer shadow-xs select-none"
          style={{
            backgroundImage: momentsCoverUrl
              ? `url(${momentsCoverUrl})`
              : 'linear-gradient(180deg, #2C2C2E 0%, #3A3A3C 50%, #48484A 100%)',
          }}
        >
          {/* Subtle dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-none" />

          {/* Profile Details in Cover */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#D4D5DC] flex items-center justify-center mb-1.5">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[22px] font-bold text-neutral-700">
                  {firstLetter}
                </span>
              )}
            </div>

            {/* Nickname & @Username */}
            <h3 className="text-[17px] font-bold text-white leading-tight drop-shadow-md">
              {userProfile.nickname || '未设置昵称'}
            </h3>
            <span className="text-[12px] font-mono text-white/80 mt-0.5 drop-shadow-sm">
              {userProfile.username || '@user'}
            </span>
          </div>

          <span className="absolute bottom-2 right-3 text-[10px] text-white/60 drop-shadow-xs pointer-events-none">
            长按更换封面
          </span>
        </div>

        {/* Moments Feed List */}
        {displayedMoments.length === 0 ? (
          <div className="bg-white p-12 text-center text-neutral-400">
            <p className="text-[15px] font-medium text-neutral-700">
              {isMyProfileOnly ? '暂未发布任何动态' : '动态圈暂无内容'}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1">
              点击右上角相机图标，记录这一刻的美好想法
            </p>
          </div>
        ) : (
          displayedMoments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onLike={toggleLikeMoment}
              onStartComment={handleStartComment}
              onDeleteMoment={deleteMoment}
              onDeleteComment={deleteCommentFromMoment}
              onOpenImage={(imgUrl) => setActiveLightboxImage(imgUrl)}
            />
          ))
        )}
      </div>

      {/* Floating Bottom Comment Input Bar */}
      {commentingState && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/[0.08] p-2.5 flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom duration-150">
          <input
            type="text"
            autoFocus
            maxLength={120}
            value={commentInputText}
            onChange={(e) => setCommentInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitComment();
              if (e.key === 'Escape') setCommentingState(null);
            }}
            placeholder={
              commentingState.replyToName
                ? `回复 @${commentingState.replyToName}...`
                : '评论...'
            }
            className="flex-1 h-9 px-3 text-[14px] bg-[#EAEAEF] rounded-xl outline-none placeholder:text-neutral-400 text-neutral-900"
          />

          <button
            type="button"
            disabled={!commentInputText.trim()}
            onClick={handleSubmitComment}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
              commentInputText.trim()
                ? 'bg-neutral-900 text-white active:scale-95'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            发送
          </button>

          <button
            type="button"
            onClick={() => setCommentingState(null)}
            className="px-2 py-1.5 text-neutral-500 hover:text-neutral-800 text-[13px] cursor-pointer"
          >
            取消
          </button>
        </div>
      )}

      {/* Publish Moment Modal */}
      {isPublishModalOpen && (
        <PublishMomentModal
          onPublish={publishMoment}
          onClose={() => setIsPublishModalOpen(false)}
        />
      )}

      {/* Image Lightbox Modal */}
      {activeLightboxImage && (
        <ImageLightboxModal
          imageUrl={activeLightboxImage}
          onClose={() => setActiveLightboxImage(null)}
        />
      )}

      {/* Change Cover Menu Alert */}
      <IOSAlert
        isOpen={showCoverMenu}
        title="更换相册封面"
        message="从手机相册中选择一张图片作为动态圈封面？"
        confirmText="从相册选取"
        cancelText="取消"
        isDestructive={false}
        onConfirm={() => {
          setShowCoverMenu(false);
          coverFileInputRef.current?.click();
        }}
        onCancel={() => setShowCoverMenu(false)}
      />
    </div>
  );
};
