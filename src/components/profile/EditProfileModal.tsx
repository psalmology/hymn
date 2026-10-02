import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { UserProfile } from '../../types';

interface EditProfileModalProps {
  initialProfile: UserProfile;
  onSave: (updated: UserProfile) => void;
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
  onClose,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || '');
  const [nickname, setNickname] = useState(initialProfile.nickname || '');
  const [username, setUsername] = useState(initialProfile.username || '');
  const [bio, setBio] = useState(initialProfile.bio || '');

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
      ...initialProfile,
      avatarUrl,
      nickname: nickname.trim() || initialProfile.nickname || 'iOS 用户',
      username: cleanUsername || initialProfile.username || '@user',
      bio: bio.trim(),
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
      <div className="pt-12 pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity cursor-pointer"
          >
            取消
          </button>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            Edit Profile
          </h2>
          <button
            type="button"
            onClick={handleSave}
            className="text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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

        {/* Inputs Group */}
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
      </div>
    </div>
  );
};
