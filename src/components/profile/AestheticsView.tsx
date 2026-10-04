import React from 'react';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatFontSize } from '../../types';
import {
  BUBBLE_PRESETS_USER,
  BUBBLE_PRESETS_ASSISTANT,
  GLOBAL_BACKGROUND_PRESETS,
} from '../../constants/themeDefaults';

export const AestheticsView: React.FC = () => {
  const { chatTheme, updateChatTheme, setProfileSubView } = useChat();

  const handleFontSizeChange = (size: ChatFontSize) => {
    updateChatTheme({ fontSize: size });
  };

  const getFontSizeClass = (size: ChatFontSize) => {
    if (size === 'small') return 'text-[13px]';
    if (size === 'large') return 'text-[17px]';
    return 'text-[15px]';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Header */}
      <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9 mb-1">
          <button
            type="button"
            onClick={() => setProfileSubView('main')}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
            <span>返回</span>
          </button>
        </div>

        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          聊天美化
        </h1>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
        {/* Live Preview Card */}
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-1 tracking-wider">
            实时预览
          </p>
          <div
            className="rounded-2xl p-4 border border-black/[0.08] shadow-xs flex flex-col gap-2.5 transition-all overflow-hidden"
            style={{ backgroundColor: chatTheme.globalBackground }}
          >
            {/* Assistant sample bubble */}
            <div className="flex items-end gap-2 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-full bg-neutral-400 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                AI
              </div>
              <div
                className={`p-2.5 rounded-2xl rounded-bl-xs border border-black/5 shadow-2xs leading-relaxed transition-all ${getFontSizeClass(
                  chatTheme.fontSize
                )}`}
                style={{
                  backgroundColor: chatTheme.assistantBubbleColor,
                  color:
                    chatTheme.assistantBubbleColor === '#AEAEB2'
                      ? '#FFFFFF'
                      : '#1C1C1E',
                }}
              >
                你好！我是你的智能助手，今天有什么可以帮你的吗？
              </div>
            </div>

            {/* User sample bubble */}
            <div className="flex items-end gap-2 max-w-[85%] self-end">
              <div
                className={`p-2.5 rounded-2xl rounded-br-xs shadow-2xs leading-relaxed transition-all ${getFontSizeClass(
                  chatTheme.fontSize
                )}`}
                style={{
                  backgroundColor: chatTheme.userBubbleColor,
                  color:
                    chatTheme.userBubbleColor === '#C7C7CC'
                      ? '#1C1C1E'
                      : '#FFFFFF',
                }}
              >
                帮我查看一下今天的日程安排 ✨
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: 我的气泡颜色 (6 Presets) */}
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-1 tracking-wider">
            我的气泡颜色 (6款灰度)
          </p>
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-black/[0.06]">
            <div className="grid grid-cols-3 gap-2">
              {BUBBLE_PRESETS_USER.map((preset) => {
                const isSelected = chatTheme.userBubbleColor === preset.color;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() =>
                      updateChatTheme({ userBubbleColor: preset.color })
                    }
                    className={`h-12 rounded-xl border flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs'
                        : 'border-black/10 hover:border-black/20'
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    <span
                      className={`text-[11px] font-medium leading-none ${
                        preset.isLightText ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-xs">
                        <Check size={9} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: 对方气泡颜色 (6 Presets) */}
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-1 tracking-wider">
            对方气泡颜色 (6款灰度)
          </p>
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-black/[0.06]">
            <div className="grid grid-cols-3 gap-2">
              {BUBBLE_PRESETS_ASSISTANT.map((preset) => {
                const isSelected =
                  chatTheme.assistantBubbleColor === preset.color;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() =>
                      updateChatTheme({ assistantBubbleColor: preset.color })
                    }
                    className={`h-12 rounded-xl border flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs'
                        : 'border-black/10 hover:border-black/20'
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    <span
                      className={`text-[11px] font-medium leading-none ${
                        preset.isLightText ? 'text-white' : 'text-neutral-800'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                        <Check size={9} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: 聊天字体大小 (小/中/大) */}
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-1 tracking-wider">
            聊天字体大小
          </p>
          <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-black/[0.06] flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleFontSizeChange('small')}
              className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                chatTheme.fontSize === 'small'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              小 (13px)
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange('medium')}
              className={`flex-1 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                chatTheme.fontSize === 'medium'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              中 (15px)
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange('large')}
              className={`flex-1 py-2 rounded-xl text-[15px] font-medium transition-all cursor-pointer ${
                chatTheme.fontSize === 'large'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              大 (17px)
            </button>
          </div>
        </div>

        {/* Section 4: 全局默认聊天背景 (灰色调色块) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
              全局默认聊天背景
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-black/[0.06]">
            <div className="grid grid-cols-3 gap-2">
              {GLOBAL_BACKGROUND_PRESETS.map((preset) => {
                const isSelected = chatTheme.globalBackground === preset.color;
                const isDark = preset.color === '#2C2C2E';
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() =>
                      updateChatTheme({ globalBackground: preset.color })
                    }
                    className={`h-11 rounded-xl border flex items-center justify-center p-1 relative transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 ring-2 ring-neutral-900/25 shadow-xs'
                        : 'border-black/10 hover:border-black/20'
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? 'text-white' : 'text-neutral-800'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div
                        className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
                        }`}
                      >
                        <Check size={9} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-400 mt-2.5 px-0.5 leading-normal">
              * 单个角色在聊天设置里自定义的背景颜色优先于全局默认背景
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
