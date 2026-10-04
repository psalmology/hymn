import React from 'react';
import { MessageSquare, BookUser, Heart } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const StatsWidget: React.FC = () => {
  const { conversations, personas, moments } = useChat();

  const totalConversations = conversations?.length || 0;
  const totalPersonas = personas?.length || 0;
  const totalLikes = moments
    .filter((m) => m.isUser)
    .reduce((acc, m) => acc + (m.likes?.length || 0), 0);

  return (
    <div className="w-full h-full min-h-[148px] rounded-[26px] bg-white/75 backdrop-blur-xl border border-white/60 p-3.5 shadow-md shadow-black/5 flex flex-col justify-between overflow-hidden relative select-none">
      {/* Subtle lighting */}
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-neutral-400/20 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <span className="text-[12px] font-semibold text-neutral-800 tracking-tight">
          状态概览
        </span>
        <span className="text-[10px] font-medium text-neutral-400 px-1.5 py-0.5 rounded-full bg-neutral-200/60">
          实时
        </span>
      </div>

      {/* 3 Metric Rows */}
      <div className="space-y-2 z-10 my-auto pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <MessageSquare size={13} className="text-neutral-500" />
            <span className="text-[11px] font-medium">对话</span>
          </div>
          <span className="text-[13px] font-bold text-neutral-900 font-mono">
            {totalConversations}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <BookUser size={13} className="text-neutral-500" />
            <span className="text-[11px] font-medium">人设</span>
          </div>
          <span className="text-[13px] font-bold text-neutral-900 font-mono">
            {totalPersonas}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Heart size={13} className="text-neutral-500" />
            <span className="text-[11px] font-medium">获赞</span>
          </div>
          <span className="text-[13px] font-bold text-neutral-900 font-mono">
            {totalLikes}
          </span>
        </div>
      </div>
    </div>
  );
};
