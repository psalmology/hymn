import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  Plus,
  UserPlus,
  BookUser,
  Sparkles,
  Camera,
  X,
  Check,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Persona, UserAccount } from '../../types';
import { IOSAlert } from '../common/IOSAlert';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount?: UserAccount; // If specified, adds friend for this target account
  headerSubtitle?: string; // e.g. "为【小号昵称】添加好友"
  onFinishFlow?: (newConvId: string) => void;
}

// Compress avatar image (max 400px per standard)
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

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  targetAccount,
  headerSubtitle,
  onFinishFlow,
}) => {
  const {
    personas,
    conversations,
    allConversations,
    activeAccountId,
    switchAccount,
    selectConversation,
    setChatSubView,
    createContactWithPersona,
    importPersonaAsContact,
  } = useChat();

  const targetAccId = targetAccount ? targetAccount.id : activeAccountId;

  // View state: 'list' | 'create_persona'
  const [subView, setSubView] = useState<'list' | 'create_persona'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Secondary confirmation for adding persona
  const [confirmPersona, setConfirmPersona] = useState<Persona | null>(null);

  // Form states for "新建角色"
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Personas that are ALREADY in the target account's friends/conversations
  const existingPersonaIds = new Set(
    (allConversations || [])
      .filter((c) => (c.accountId || 'main') === targetAccId)
      .map((c) => c.personaId)
      .filter(Boolean)
  );

  // Available personas to add (not yet in target account)
  const availablePersonas = useMemo(() => {
    const unadded = personas.filter((p) => !existingPersonaIds.has(p.id));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return unadded;
    return unadded.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.bio || '').toLowerCase().includes(q)
    );
  }, [personas, existingPersonaIds, searchQuery]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file, 400, 0.88);
      setNewAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
    e.target.value = '';
  };

  // Confirm and add persona
  const handleConfirmAddPersona = () => {
    if (!confirmPersona) return;
    const convId = importPersonaAsContact(confirmPersona.id, targetAccId);

    // If target was another account, switch to it
    if (targetAccId !== activeAccountId) {
      switchAccount(targetAccId);
    }

    selectConversation(convId);
    setChatSubView('room');

    if (onFinishFlow) {
      onFinishFlow(convId);
    }

    setConfirmPersona(null);
    onClose();
  };

  // Save new custom persona and add as friend
  const handleSaveNewPersona = () => {
    const cleanName = newName.trim();
    if (!cleanName) {
      setCreateErrorMessage('请填写角色名称');
      return;
    }

    setCreateErrorMessage(null);
    const finalDescription =
      newDescription.trim() || `你是一位友好的对话角色：${cleanName}。`;

    const convId = createContactWithPersona(
      cleanName,
      finalDescription,
      newRemark.trim() || undefined,
      newAvatarUrl || undefined,
      undefined,
      targetAccId
    );

    // If target was another account, switch to it
    if (targetAccId !== activeAccountId) {
      switchAccount(targetAccId);
    }

    selectConversation(convId);
    setChatSubView('room');

    if (onFinishFlow) {
      onFinishFlow(convId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7] select-none animate-in slide-in-from-bottom duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* ================= VIEW 1: PERSONAS LIST & SEARCH ================= */}
      {subView === 'list' && (
        <>
          {/* Header */}
          <div className="ios-safe-header pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
            <div className="flex items-center justify-between h-9">
              {/* Circular Back / Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 active:scale-95 transition-transform flex items-center justify-center text-neutral-700 cursor-pointer"
                title="返回"
              >
                <ChevronLeft size={20} className="-ml-0.5" />
              </button>

              <div className="text-center">
                <h2 className="text-[16px] font-semibold text-neutral-900 leading-tight">
                  添加好友
                </h2>
                {headerSubtitle && (
                  <p className="text-[11px] text-neutral-500 font-normal leading-tight mt-0.5">
                    {headerSubtitle}
                  </p>
                )}
              </div>

              <div className="w-8" />
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
                placeholder="搜索人设库中的角色..."
                className="w-full h-9 pl-9 pr-3 text-[14px] bg-[#E3E3E8] rounded-xl text-neutral-900 placeholder:text-neutral-500 outline-none focus:bg-[#EAEAEF] focus:ring-1 focus:ring-black/15 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Section 1: Fixed First Item - "新建角色" */}
            <div>
              <p className="text-[12px] font-medium text-neutral-400 px-3 pb-1.5 uppercase tracking-wider">
                自定义角色
              </p>
              <div
                onClick={() => setSubView('create_persona')}
                className="bg-white rounded-2xl p-3.5 shadow-xs border border-black/[0.04] flex items-center justify-between active:bg-neutral-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-200 transition-colors shadow-2xs">
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">
                      新建角色
                    </h3>
                    <p className="text-[12px] text-neutral-500 mt-0.5">
                      自定义角色头像、设定与备注并成为好友
                    </p>
                  </div>
                </div>
                <span className="text-[12px] text-neutral-800 font-medium px-3 py-1 bg-neutral-100 rounded-full">
                  新建
                </span>
              </div>
            </div>

            {/* Section 2: Personas Library (not yet friends of target account) */}
            <div>
              <div className="flex items-center justify-between px-3 pb-1.5">
                <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">
                  人设库角色
                </p>
                <span className="text-[11px] text-neutral-400">
                  {availablePersonas.length} 个可添加
                </span>
              </div>

              {availablePersonas.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-neutral-400 shadow-xs border border-black/[0.04] flex flex-col items-center justify-center">
                  <BookUser size={32} className="text-neutral-300 mb-2" />
                  <p className="text-[14px] text-neutral-600 font-medium">
                    {searchQuery ? '未找到匹配的人设' : '暂无可添加的人设，试试新建角色'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubView('create_persona')}
                    className="mt-3 px-4 py-1.5 bg-neutral-900 text-white rounded-full text-[12px] font-semibold active:scale-95 transition-transform cursor-pointer"
                  >
                    立即新建角色
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xs border border-black/[0.04] overflow-hidden divide-y divide-black/[0.05]">
                  {availablePersonas.map((p) => {
                    const firstLetter = (p.name || '人').slice(0, 1);
                    const firstLineDesc =
                      p.description?.split('\n')?.[0]?.trim() || '暂无设定介绍';

                    return (
                      <div
                        key={p.id}
                        onClick={() => setConfirmPersona(p)}
                        className="p-3.5 flex items-center justify-between gap-3 active:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#D4D5DC] flex items-center justify-center shrink-0 border border-black/[0.06] shadow-2xs">
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[18px] font-bold text-neutral-700">
                                {firstLetter}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                              {p.name}
                            </h4>
                            <p className="text-[12px] text-neutral-500 truncate mt-0.5">
                              {firstLineDesc}
                            </p>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmPersona(p);
                          }}
                          className="px-3 py-1 bg-neutral-900 hover:bg-black text-white text-[12px] font-semibold rounded-full active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
                        >
                          添加
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW 2: 新建角色表单 (CREATE PERSONA) ================= */}
      {subView === 'create_persona' && (
        <>
          {/* Header */}
          <div className="ios-safe-header pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
            <div className="flex items-center justify-between h-9">
              <button
                type="button"
                onClick={() => setSubView('list')}
                className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
              >
                <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
                <span>返回</span>
              </button>

              <h2 className="text-[16px] font-semibold text-neutral-900">
                新建角色
              </h2>

              <button
                type="button"
                onClick={handleSaveNewPersona}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer pl-2"
              >
                保存
              </button>
            </div>
          </div>

          {/* Error Message */}
          {createErrorMessage && (
            <div className="mx-4 mt-3 px-3.5 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-600 flex items-center justify-between animate-in fade-in duration-150">
              <span>{createErrorMessage}</span>
              <button
                type="button"
                onClick={() => setCreateErrorMessage(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Avatar Picker */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#D4D5DC] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
              >
                {newAvatarUrl ? (
                  <img
                    src={newAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[28px] font-bold text-neutral-700">
                    {(newName.trim() || '角').slice(0, 1)}
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
                设置角色头像
              </button>
            </div>

            {/* Inputs Group 1 */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
              {/* 名称 (必填) */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-[14px] font-medium text-neutral-700 w-24 shrink-0 flex items-center gap-1">
                  名称 <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (createErrorMessage) setCreateErrorMessage(null);
                  }}
                  placeholder="角色名称 (必填)"
                  className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>

              {/* 备注 (选填) */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-[14px] font-medium text-neutral-700 w-24 shrink-0">
                  备注
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="角色备注 (选填)"
                  className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Inputs Group 2: 人设内容 */}
            <div className="bg-white rounded-2xl p-4 shadow-xs space-y-2">
              <label className="text-[14px] font-medium text-neutral-800 block">
                人设内容
              </label>
              <textarea
                rows={5}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="详细描述角色的性格、说话语气、背景经历与互动设定..."
                className="w-full p-3 text-[14px] bg-neutral-100 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-neutral-200/70 transition-colors resize-none leading-relaxed font-sans"
              />
            </div>

            <p className="text-[11px] text-neutral-400 text-center px-4 leading-normal">
              保存后该角色将自动加入公共「人设库」，并同时成为当前账号的好友。
            </p>
          </div>
        </>
      )}

      {/* ================= SECONDARY CONFIRMATION MODAL ================= */}
      <IOSAlert
        isOpen={Boolean(confirmPersona)}
        title="添加好友"
        message={`确定要添加“${confirmPersona?.name}”为好友吗？`}
        confirmText="添加"
        cancelText="取消"
        onConfirm={handleConfirmAddPersona}
        onCancel={() => setConfirmPersona(null)}
      />
    </div>
  );
};
