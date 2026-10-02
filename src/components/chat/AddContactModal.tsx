import React, { useState, useRef } from 'react';
import { Camera, Plus, BookOpen, UserPlus, Check, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface AddContactModalProps {
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
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

export const AddContactModal: React.FC<AddContactModalProps> = ({
  onClose,
  onOpenChat,
}) => {
  const {
    personas,
    conversations,
    importPersonaAsContact,
    createContactWithPersona,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'import' | 'create'>('import');

  // Form states for "新建角色"
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');

  // Just added contact feedback
  const [addedConvId, setAddedConvId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personas that are NOT yet in contacts (conversations)
  const existingPersonaIds = new Set(
    conversations.map((c) => c.personaId).filter(Boolean)
  );
  const unlinkedPersonas = personas.filter((p) => !existingPersonaIds.has(p.id));

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

  const handleImportPersona = (personaId: string) => {
    const convId = importPersonaAsContact(personaId);
    setAddedConvId(convId);
  };

  const handleCreateContact = () => {
    if (!name.trim()) return;
    const finalDescription =
      description.trim() || `你是一位友好的对话伙伴：${name.trim()}。`;
    const convId = createContactWithPersona(
      name.trim(),
      finalDescription,
      remark.trim() || undefined,
      avatarUrl || undefined,
      bio.trim() || undefined
    );
    setAddedConvId(convId);
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

      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity cursor-pointer"
          >
            {addedConvId ? '关闭' : '取消'}
          </button>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            添加好友
          </h2>
          <div className="w-10" />
        </div>

        {/* Tab Switcher */}
        <div className="mt-2.5 p-1 bg-neutral-200/80 rounded-xl flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            从人设库导入
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            新建角色
          </button>
        </div>
      </div>

      {/* Success Banner if just added */}
      {addedConvId && (
        <div className="mx-4 mt-3 p-3 bg-neutral-900 text-white rounded-2xl flex items-center justify-between shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-[13px] font-medium">已添加为好友</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChat(addedConvId);
            }}
            className="px-3 py-1 bg-white text-neutral-900 text-[12px] font-semibold rounded-xl flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
          >
            <MessageSquare size={13} />
            <span>发消息</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'import' ? (
          /* Tab 1: 从人设库导入 */
          <div className="space-y-3">
            <p className="text-[12px] text-neutral-500 font-medium px-1 uppercase tracking-wider">
              人设库可用角色 ({unlinkedPersonas.length})
            </p>

            {unlinkedPersonas.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-black/[0.06] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-2">
                  <BookOpen size={24} />
                </div>
                <h4 className="text-[15px] font-semibold text-neutral-800">
                  角色已全部添加
                </h4>
                <p className="text-[12px] text-neutral-400 mt-1 max-w-[220px] mx-auto">
                  人设库中的所有角色已全部导入为联系人。您可以切换到「新建角色」创建更多好友。
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-3.5 px-4 py-1.5 bg-neutral-900 text-white text-[12px] font-semibold rounded-xl active:scale-95 transition-transform cursor-pointer"
                >
                  去新建角色
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-black/[0.06] overflow-hidden divide-y divide-black/[0.06]">
                {unlinkedPersonas.map((persona) => {
                  const firstL = persona.name.slice(0, 1) || '人';
                  return (
                    <div
                      key={persona.id}
                      className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3a3a3c] to-[#636366] text-white flex items-center justify-center shrink-0 shadow-xs font-semibold text-[14px]">
                          {persona.avatarUrl ? (
                            <img
                              src={persona.avatarUrl}
                              alt={persona.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            firstL
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                            {persona.name}
                          </h4>
                          <p className="text-[12px] text-neutral-500 truncate max-w-[200px]">
                            {persona.description || '暂无人设描述'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportPersona(persona.id)}
                        className="px-3.5 py-1.5 bg-neutral-900 text-white text-[12px] font-semibold rounded-xl active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>添加</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: 新建角色 */
          <div className="space-y-4">
            {/* Avatar selector */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-18 h-18 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#D4D5DC] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[24px] font-bold text-neutral-700">
                    {name ? name.slice(0, 1) : '友'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-medium text-neutral-700 hover:text-black mt-1.5 cursor-pointer"
              >
                设置头像
              </button>
            </div>

            {/* Inputs Group */}
            <div className="bg-white rounded-2xl shadow-xs border border-black/[0.06] overflow-hidden divide-y divide-black/[0.06]">
              {/* 名称 (必填) */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
                  名称 <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="角色名称（例如：苏格拉底）"
                  className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>

              {/* 备注 (选填) */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
                  备注
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="好友备注名（选填）"
                  className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>

              {/* 签名 (选填) */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-[14px] font-medium text-neutral-600 w-20 shrink-0">
                  个性签名
                </span>
                <input
                  type="text"
                  maxLength={50}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="个性签名或简短问候（选填）"
                  className="flex-1 text-right text-[14px] text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* 人设内容 (必填) */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-neutral-500 px-1 uppercase tracking-wider block">
                人设 Prompt 内容 <span className="text-red-500">*</span>
              </label>
              <div className="bg-white rounded-2xl shadow-xs border border-black/[0.06] p-3">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="设定角色的性格、语气口吻、专属背景等，例如：'你是一位充满智慧的哲学家，善于用反问启发思考...'"
                  className="w-full text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleCreateContact}
              className={`w-full py-3 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer shadow-xs ${
                name.trim()
                  ? 'bg-neutral-900 text-white active:scale-98'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              保存并添加联系人
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
