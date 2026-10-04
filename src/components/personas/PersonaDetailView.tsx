import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Trash2, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export const PersonaDetailView: React.FC = () => {
  const {
    personas,
    selectedPersonaId,
    setPersonaSubView,
    updatePersona,
    deletePersona,
    startChatWithPersona,
  } = useChat();

  const persona = personas.find((p) => p.id === selectedPersonaId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setDescription(persona.description);
    }
  }, [persona]);

  if (!persona) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F2F2F7] p-6 text-neutral-500">
        <p>未找到该人设信息</p>
        <button
          type="button"
          onClick={() => setPersonaSubView('list')}
          className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] rounded-full cursor-pointer"
        >
          返回人设库
        </button>
      </div>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('请输入人设名称');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    updatePersona(persona.id, {
      name: name.trim(),
      description: description.trim(),
    });

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  const handleStartChat = () => {
    // Save current edits first if any
    if (name.trim()) {
      updatePersona(persona.id, {
        name: name.trim(),
        description: description.trim(),
      });
    }
    startChatWithPersona(persona.id);
  };

  const handleDeleteConfirm = () => {
    deletePersona(persona.id);
    setShowDeleteAlert(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto relative">
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-[13px] px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check size={14} className="text-emerald-400" />
          <span>人设已保存</span>
        </div>
      )}

      {/* Navigation Header */}
      <div className="ios-safe-header px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPersonaSubView('list')}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
            <span>人设库</span>
          </button>

          <h2 className="text-[16px] font-semibold text-neutral-900 truncate">
            人设详情
          </h2>

          <button
            type="button"
            onClick={handleSave}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>

      {/* Detail Form Content */}
      <div className="p-4 space-y-5 pb-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl font-medium animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {/* Card 1: 名称编辑 */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            基本信息
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden p-3.5 space-y-1.5">
            <label className="block text-[13px] font-medium text-neutral-700">
              人设名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full px-3 py-2 text-[15px] bg-[#EFEFF4] rounded-xl text-neutral-900 outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>
        </div>

        {/* Card 2: 人设内容编辑 */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            设定内容
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden p-3.5 space-y-1.5">
            <label className="block text-[13px] font-medium text-neutral-700">
              角色设定详情
            </label>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="编写这个角色的详细设定..."
              className="w-full p-3 text-[14px] bg-[#EFEFF4] rounded-xl text-neutral-900 outline-none resize-none leading-relaxed focus:ring-1 focus:ring-black/20"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              修改后，所有绑定该人设的对话将立即使用全新设定。
            </p>
          </div>
        </div>

        {/* Card 3: 用这个人设开始聊天 Action Button */}
        <div>
          <button
            type="button"
            onClick={handleStartChat}
            className="w-full py-3.5 bg-neutral-900 hover:bg-black active:scale-[0.99] text-white rounded-2xl shadow-xs flex items-center justify-center gap-2 font-semibold text-[15px] transition-all cursor-pointer"
          >
            <MessageSquare size={17} />
            <span>用这个人设开始聊天</span>
          </button>
        </div>

        {/* Card 4: 删除人设 (红色文字, 二次确认) */}
        <div>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDeleteAlert(true)}
              className="w-full px-4 py-3.5 text-center text-[15px] font-semibold text-[#FF3B30] active:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={16} />
              <span>删除人设</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      <IOSAlert
        isOpen={showDeleteAlert}
        title="删除人设"
        message="确定要删除该人设吗？已用它聊过的对话将保留全部聊天记录，之后对话不再携带此人设。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteAlert(false)}
      />
    </div>
  );
};
