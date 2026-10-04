import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Conversation } from '../../types';

interface EditContactModalProps {
  contact: Conversation;
  onSave: (updates: {
    name: string;
    remark: string;
    avatarUrl: string;
    bio: string;
  }) => void;
  onClose: () => void;
}

// Compress avatar image (max 400px per standard)
function compressImage(file: File, maxDim: number = 400, quality: number = 0.88): Promise<string> {
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

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  onSave,
  onClose,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(contact.avatarUrl || contact.settings?.avatarUrl || '');
  const [name, setName] = useState(contact.title || '');
  const [remark, setRemark] = useState(contact.remark || '');
  const [bio, setBio] = useState(contact.bio || contact.settings?.bio || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 0.88);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
    e.target.value = '';
  };

  const handleDone = () => {
    onSave({
      name: name.trim() || contact.title || '联系人',
      remark: remark.trim(),
      avatarUrl,
      bio: bio.trim(),
    });
    onClose();
  };

  const displayName = remark.trim() || name.trim() || '联系人';
  const firstLetter = displayName.slice(0, 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7] select-none animate-in slide-in-from-bottom duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Top Header */}
      <div className="ios-safe-header pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onClose}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
          >
            取消
          </button>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            修改资料
          </h2>
          <button
            type="button"
            onClick={handleDone}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer"
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
                alt={displayName}
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
          {/* 名称 */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
              名称
            </span>
            <input
              type="text"
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="联系人名称"
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          {/* 备注 */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
              备注
            </span>
            <input
              type="text"
              maxLength={24}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="添加备注名（与聊天设置同步）"
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
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
              placeholder="设置个性签名或简介..."
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
