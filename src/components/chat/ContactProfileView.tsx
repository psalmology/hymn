import React, { useState } from 'react';
import { ChevronLeft, MessageSquare, Edit3, Sparkles } from 'lucide-react';
import { Conversation, Persona } from '../../types';
import { useChat } from '../../context/ChatContext';
import { EditContactModal } from './EditContactModal';

interface ContactProfileViewProps {
  contactId: string;
  onBack: () => void;
}

export const ContactProfileView: React.FC<ContactProfileViewProps> = ({
  contactId,
  onBack,
}) => {
  const {
    conversations,
    personas,
    selectConversation,
    setChatSubView,
    updateContactDetails,
  } = useChat();

  const [isEditing, setIsEditing] = useState(false);

  const contact = conversations.find((c) => c.id === contactId);
  const linkedPersona: Persona | undefined = contact?.personaId
    ? personas.find((p) => p.id === contact.personaId)
    : undefined;

  if (!contact) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F2F2F7] p-4 text-center">
        <p className="text-neutral-500 text-[14px]">联系人不存在或已被删除</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-neutral-900 text-white text-[13px] rounded-xl"
        >
          返回联系人列表
        </button>
      </div>
    );
  }

  const avatar = contact.avatarUrl || contact.settings?.avatarUrl;
  const name = contact.title || '联系人';
  const remark = contact.remark?.trim();
  const bio = contact.bio || contact.settings?.bio || linkedPersona?.bio || linkedPersona?.description;
  const firstLetter = (remark || name).slice(0, 1);

  const handleStartChat = () => {
    selectConversation(contact.id);
    setChatSubView('room');
  };

  const handleSaveEdit = (updates: {
    name: string;
    remark: string;
    avatarUrl: string;
    bio: string;
  }) => {
    updateContactDetails(contact.id, updates);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-8 mb-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1.5 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>通讯录</span>
          </button>
        </div>
      </div>

      {/* Profile Details Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Top Card: Avatar, Name, Remark, Bio */}
        <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#D4D5DC] flex items-center justify-center mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={remark || name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[30px] font-bold text-neutral-700">
                {firstLetter}
              </span>
            )}
          </div>

          {/* Name & Remark */}
          <h2 className="text-[20px] font-bold text-neutral-900 leading-snug">
            {remark || name}
          </h2>
          {remark && (
            <p className="text-[13px] text-neutral-400 font-medium mt-0.5">
              原名: {name}
            </p>
          )}

          {/* Bio / Signature */}
          {bio ? (
            <p className="text-[13px] text-neutral-600 mt-2 px-3 leading-relaxed max-w-[280px]">
              {bio}
            </p>
          ) : (
            <p className="text-[12px] text-neutral-400 mt-1 italic">
              暂无个性签名
            </p>
          )}

          {/* Action Buttons: 发消息 & 修改资料 */}
          <div className="w-full mt-5 pt-4 border-t border-black/[0.06] flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartChat}
              className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-[13px] font-semibold active:scale-95 transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={15} />
              <span>发消息</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2.5 px-3 bg-[#E5E5EA] hover:bg-[#DCDCE1] text-neutral-800 rounded-xl text-[13px] font-semibold active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Edit3 size={15} />
              <span>修改资料</span>
            </button>
          </div>
        </div>

        {/* Character Info Card */}
        <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-neutral-800">
            <Sparkles size={16} className="text-neutral-500" />
            <h4 className="text-[14px] font-semibold">人设背景设定</h4>
          </div>

          <p className="text-[13px] text-neutral-600 leading-relaxed bg-[#F8F8FA] p-3 rounded-xl border border-black/[0.04]">
            {linkedPersona?.description ||
              contact.settings?.characterPrompt ||
              '默认智能助手角色，随时解答您的提问并进行自然交流。'}
          </p>

          <div className="pt-1 flex items-center justify-between text-[12px] text-neutral-400">
            <span>会话消息数: {contact.messages?.length || 0} 条</span>
            <span>
              添加时间:{' '}
              {new Date(contact.createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {isEditing && (
        <EditContactModal
          contact={contact}
          onSave={handleSaveEdit}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};
