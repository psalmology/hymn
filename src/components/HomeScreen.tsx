import React from 'react';
import { MessageSquare, Settings as SettingsIcon, BookUser } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { ProfileWidget } from './home/ProfileWidget';

export const HomeScreen: React.FC = () => {
  const { openApp, conversations, personas } = useChat();

  const totalConversations = conversations?.length || 0;
  const totalPersonas = personas?.length || 0;

  return (
    <div className="w-full h-full flex flex-col justify-between pt-12 px-4 pb-4 sm:pb-5 relative overflow-hidden select-none bg-gradient-to-b from-[#e3e4e8] via-[#dcdde2] to-[#ced0d7]">
      {/* Background silk abstract lighting effect */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-neutral-400/20 blur-3xl pointer-events-none" />

      {/* Top area: Personal Profile Card Widget */}
      <div className="z-10">
        <ProfileWidget />
      </div>

      {/* 4-column App Grid */}
      <div className="grid grid-cols-4 gap-y-7 gap-x-4 px-2 my-auto z-10">
        {/* App 1: 聊天 (Chat) */}
        <div className="flex flex-col items-center group">
          <button
            type="button"
            onClick={() => openApp('chat')}
            className="relative w-[62px] h-[62px] rounded-[22%] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.18)] border border-white/20 active:scale-90 transition-transform duration-150 cursor-pointer"
          >
            <MessageSquare size={30} strokeWidth={2.1} />
          </button>
          <span className="text-[12px] font-normal text-neutral-800 tracking-tight mt-1.5 text-center">
            聊天
          </span>
        </div>

        {/* App 2: 人设库 (Personas) */}
        <div className="flex flex-col items-center group">
          <button
            type="button"
            onClick={() => openApp('personas')}
            className="relative w-[62px] h-[62px] rounded-[22%] bg-gradient-to-b from-[#555559] to-[#38383b] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.18)] border border-white/20 active:scale-90 transition-transform duration-150 cursor-pointer"
          >
            <BookUser size={30} strokeWidth={2.1} />
          </button>
          <span className="text-[12px] font-normal text-neutral-800 tracking-tight mt-1.5 text-center">
            人设库
          </span>
        </div>

        {/* App 3: 设置 (Settings) */}
        <div className="flex flex-col items-center group">
          <button
            type="button"
            onClick={() => openApp('settings')}
            className="w-[62px] h-[62px] rounded-[22%] bg-gradient-to-b from-[#8e8e93] to-[#636366] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.18)] border border-white/20 active:scale-90 transition-transform duration-150 cursor-pointer"
          >
            <SettingsIcon size={31} strokeWidth={2.1} />
          </button>
          <span className="text-[12px] font-normal text-neutral-800 tracking-tight mt-1.5 text-center">
            设置
          </span>
        </div>

        {/* Grid slots 4 remains empty for future expansion */}
      </div>

      {/* Bottom Frosted Glass Dock Bar */}
      <div className="z-10 pb-0">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[30px] px-6 py-2.5 shadow-lg shadow-black/5 flex items-center justify-around">
          {/* Dock shortcut 1: 聊天 */}
          <button
            type="button"
            onClick={() => openApp('chat')}
            className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] text-white flex items-center justify-center shadow-md border border-white/20 active:scale-90 transition-transform cursor-pointer relative"
          >
            <MessageSquare size={26} strokeWidth={2.1} />
          </button>

          {/* Dock shortcut 2: 设置 */}
          <button
            type="button"
            onClick={() => openApp('settings')}
            className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-b from-[#8e8e93] to-[#636366] text-white flex items-center justify-center shadow-md border border-white/20 active:scale-90 transition-transform cursor-pointer"
          >
            <SettingsIcon size={27} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </div>
  );
};
