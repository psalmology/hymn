import React, { useState, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { IOSAlert } from '../common/IOSAlert';

interface EditProfileModalProps {
  initialProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
  onDeleteAltAccount?: (accountId: string) => void;
  onClose: () => void;
}

// Compress avatar to max 400px (per requirement)
function compressAvatar(file: File, maxDim: number = 400, quality: number = 0.88): Promise<string> {
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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  initialProfile,
  onSave,
  onDeleteAltAccount,
  onClose,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || '');
  const [nickname, setNickname] = useState(initialProfile.nickname || '');
  const [username, setUsername] = useState(initialProfile.username || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [bioDetails, setBioDetails] = useState(initialProfile.bioDetails || '');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file, 400, 0.88);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
    e.target.value = '';
  };

  const handleSave = () => {
    let cleanUsername = username.trim();
    if (cleanUsername && !cleanUsername.startsWith('@')) {
      cleanUsername = `@${cleanUsername}`;
    }

    onSave({
      avatarUrl,
      nickname: nickname.trim() || initialProfile.nickname || 'iOS 用户',
      username: cleanUsername || initialProfile.username || '@user',
      bio: bio.trim(),
      bioDetails: bioDetails.trim(),
    });
    onClose();
  };

  const firstLetter = (nickname.trim() || '用').slice(0, 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7] select-none animate-in slide-in-from-bottom duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Header */}
      <div className="ios-safe-header pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onClose}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-2.5 px-2.5"
          >
            取消
          </button>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            {initialProfile.isMain ? '编辑资料' : '编辑小号资料'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            className="min-w-[44px] min-h-[44px] -mr-2.5 px-2.5 flex items-center justify-end text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Avatar Picker */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#D4D5DC] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[28px] font-bold text-neutral-700">
                {firstLetter}
              </span>
            )}
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] font-medium text-neutral-800 hover:text-black mt-2 active:opacity-60 cursor-pointer"
          >
            更换头像
          </button>
        </div>

        {/* Inputs Group 1 */}
        <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
          {/* 昵称 */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
              昵称
            </span>
            <input
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="您的昵称"
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          {/* @用户名 */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
              用户名
            </span>
            <input
              type="text"
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@alex_chen"
              className="flex-1 text-right text-[14px] text-neutral-900 font-mono outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          {/* 个性签名 */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
              个性签名
            </span>
            <input
              type="text"
              maxLength={60}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="写点什么介绍自己..."
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Inputs Group 2: 自我介绍 (多行，选填，说明"我是谁、有什么设定"，会提供给 AI) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-800">
              自我介绍与设定
            </span>
            <span className="text-[11px] text-neutral-400">提供给 AI</span>
          </div>
          <p className="text-[12px] text-neutral-400 leading-normal">
            说明“我是谁、有什么设定”，在此账号下与 AI 聊天时，AI 会感知您的该设定。
          </p>
          <textarea
            rows={4}
            value={bioDetails}
            onChange={(e) => setBioDetails(e.target.value)}
            placeholder="例如：我是一名在读研究生，性格开朗；请以学长口吻与我交流..."
            className="w-full mt-2 p-3 text-[14px] bg-neutral-100 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-neutral-200/70 transition-colors resize-none leading-relaxed font-sans"
          />
        </div>

        {/* 小号删除按钮 (主号不能删除) */}
        {!initialProfile.isMain && (
          <div className="pt-2 pb-4 text-center">
            <button
              type="button"
              onClick={() => setShowDeleteAlert(true)}
              className="text-[15px] font-medium text-[#FF3B30] hover:text-red-600 active:opacity-60 transition-opacity cursor-pointer py-2 px-4"
            >
              删除小号
            </button>
          </div>
        )}
      </div>

      {/* Delete Alt Account Confirmation Alert */}
      <IOSAlert
        isOpen={showDeleteAlert}
        title="删除小号"
        message="确定要删除该小号吗？删除后将同时清空该小号的好友、聊天记录和动态，此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (onDeleteAltAccount && initialProfile.id) {
            onDeleteAltAccount(initialProfile.id);
          }
          setShowDeleteAlert(false);
          onClose();
        }}
        onCancel={() => setShowDeleteAlert(false)}
      />
    </div>
  );
};

