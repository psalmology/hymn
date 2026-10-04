import React, { useState, useRef } from 'react';
import { Camera, X, ChevronLeft, UserPlus, Sparkles } from 'lucide-react';
import { UserAccount } from '../../types';
import { useChat } from '../../context/ChatContext';

interface CreateAltModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'add_friend_flow' | 'direct_create';
  onNextStep?: (createdAccount: UserAccount) => void;
}

// Compress avatar image to max 400px (standard iOS quality)
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

export const CreateAltModal: React.FC<CreateAltModalProps> = ({
  isOpen,
  onClose,
  mode = 'add_friend_flow',
  onNextStep,
}) => {
  const { createAltAccount, switchAccount } = useChat();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [bioDetails, setBioDetails] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleSubmit = () => {
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setErrorMessage('请填写昵称');
      return;
    }

    setErrorMessage(null);

    let cleanUsername = username.trim();
    if (cleanUsername && !cleanUsername.startsWith('@')) {
      cleanUsername = `@${cleanUsername}`;
    }

    const resolvedUsername = cleanUsername || `@user_${Date.now().toString().slice(-4)}`;

    const newId = createAltAccount({
      avatarUrl,
      nickname: cleanNick,
      username: resolvedUsername,
      bio: bio.trim(),
      bioDetails: bioDetails.trim(),
    });

    const newAccount: UserAccount = {
      id: newId,
      isMain: false,
      avatarUrl,
      nickname: cleanNick,
      username: resolvedUsername,
      bio: bio.trim(),
      bioDetails: bioDetails.trim(),
      createdAt: Date.now(),
    };

    if (mode === 'add_friend_flow' && onNextStep) {
      onNextStep(newAccount);
    } else {
      // Direct create: switch to it and close
      switchAccount(newId);
      onClose();
    }
  };

  const firstLetter = (nickname.trim() || '小').slice(0, 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7] select-none animate-in slide-in-from-bottom duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Top Header Bar */}
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
            {mode === 'add_friend_flow' ? '创建小号 (1/2)' : '创建小号'}
          </h2>

          <button
            type="button"
            onClick={handleSubmit}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer pl-2"
          >
            {mode === 'add_friend_flow' ? '下一步' : '完成'}
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mx-4 mt-3 px-3.5 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-600 flex items-center justify-between animate-in fade-in duration-150">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Form Body */}
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
            设置小号头像
          </button>
        </div>

        {/* Inputs Group 1 */}
        <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
          {/* 昵称 (必填) */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-700 w-24 shrink-0 flex items-center gap-1">
              昵称 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="小号昵称 (必填)"
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          {/* @用户名 (选填) */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-700 w-24 shrink-0">
              用户名
            </span>
            <input
              type="text"
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="选填，如 @my_alt"
              className="flex-1 text-right text-[14px] text-neutral-900 font-mono outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          {/* 个性签名 (选填) */}
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-700 w-24 shrink-0">
              个性签名
            </span>
            <input
              type="text"
              maxLength={60}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="一句话介绍自己..."
              className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Inputs Group 2: 自我介绍 (多行，选填，说明"我是谁、有什么设定"，会提供给 AI) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-medium text-neutral-800">
              自我介绍与人设背景
            </label>
            <span className="text-[11px] text-neutral-400 font-normal">提供给 AI 识别</span>
          </div>
          <p className="text-[12px] text-neutral-400 leading-normal">
            说明“我是谁、有什么设定”，在此小号下与 AI 聊天时，AI 会感知您的这重身份。
          </p>
          <textarea
            rows={4}
            value={bioDetails}
            onChange={(e) => setBioDetails(e.target.value)}
            placeholder="例如：我是一名在读研究生，性格开朗，对人工智能充满好奇；请以学长的口吻与我交流..."
            className="w-full mt-2 p-3 text-[14px] bg-neutral-100 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-neutral-200/70 transition-colors resize-none leading-relaxed font-sans"
          />
        </div>

        <p className="text-[11px] text-neutral-400 text-center px-4 leading-normal">
          每个小号拥有独立的好友列表、聊天记录与动态，可随时在主页“切换账号”进行切换。
        </p>
      </div>
    </div>
  );
};
