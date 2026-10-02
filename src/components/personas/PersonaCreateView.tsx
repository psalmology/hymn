import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const PersonaCreateView: React.FC = () => {
  const { setPersonaSubView, addPersona } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('请输入人设名称');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    addPersona({
      name: name.trim(),
      description: description.trim(),
    });

    setPersonaSubView('list');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Navigation Header */}
      <div className="pt-11 px-3 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPersonaSubView('list')}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>返回</span>
          </button>

          <h2 className="text-[16px] font-semibold text-neutral-900 truncate">
            新建人设
          </h2>

          <button
            type="button"
            onClick={handleSave}
            className="text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 cursor-pointer px-1"
          >
            保存
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-5 pb-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl font-medium animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {/* Card 1: 名称 (必填) */}
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
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="例如：毒舌书评人、暖心大哥哥..."
              className="w-full px-3 py-2 text-[15px] bg-[#EFEFF4] rounded-xl text-neutral-900 outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>
        </div>

        {/* Card 2: 人设内容 (多行文本框) */}
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
              placeholder="编写这个角色的详细设定，如性格特点、说话口吻、知识领域、对待用户的习惯用语或禁忌事项等..."
              className="w-full p-3 text-[14px] bg-[#EFEFF4] rounded-xl text-neutral-900 outline-none resize-none leading-relaxed focus:ring-1 focus:ring-black/20"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              聊天时，这段内容将作为 System 提示词发送给 AI 大模型。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
