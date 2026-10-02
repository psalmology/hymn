import React from 'react';
import { ChevronLeft, ShieldCheck, Smartphone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const AboutView: React.FC = () => {
  const { setSettingsSubView, showStatusBar } = useChat();

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Navigation Header */}
      <div className="pt-11 px-3 bg-white/90 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSettingsSubView('main')}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-neutral-900 active:opacity-60 transition-opacity -ml-1 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>设置</span>
          </button>

          <h2 className="text-[15px] font-semibold text-neutral-900">
            关于本应用
          </h2>

          <div className="w-12" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* App Hero Card */}
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-[22%] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] text-white flex items-center justify-center shadow-lg border border-white/20 mb-2.5">
            <Smartphone size={32} />
          </div>
          <h3 className="text-[17px] font-bold text-neutral-900">
            iOS 手机助手 Web OS
          </h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">版本 1.0.0 (Build 2026)</p>
        </div>

        {/* Specifications Group */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            系统与架构特性
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06] text-[14px]">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-neutral-500">设计规范</span>
              <span className="font-medium text-neutral-800">iOS 极简灰度调性</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-neutral-500">接口标准</span>
              <span className="font-medium text-neutral-800">OpenAI API 兼容协议</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-neutral-500">多轮对话</span>
              <span className="font-medium text-neutral-800">自动携带上下文记忆</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-neutral-500">响应式适配</span>
              <span className="font-medium text-neutral-800">桌面手机框 / 手机全屏</span>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            隐私与数据安全
          </p>
          <div className="bg-white rounded-2xl shadow-xs p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-neutral-700 shrink-0 mt-0.5" />
            <p className="text-[12px] text-neutral-600 leading-relaxed">
              本应用为纯前端单页架构，您的 API Key、Base URL 以及所有对话记录均严格保存在本地浏览器 LocalStorage 中，不会经过任何第三方中间代理或后端进行数据收集。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
