import React, { useState } from 'react';
import { StatusBar } from './StatusBar';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  const [forceFullScreen, setForceFullScreen] = useState(false);
  const { showStatusBar } = useChat();

  return (
    <div className="w-full h-full h-[100dvh] flex items-center justify-center bg-[#F2F2F7] p-0 sm:p-3 select-none relative overflow-hidden font-sans">
      {/* Viewport Mode Switcher for Desktop */}
      <div className="hidden sm:flex absolute top-3 right-4 z-50 items-center gap-1.5 bg-neutral-800/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-neutral-700/60 shadow-md">
        <button
          type="button"
          onClick={() => setForceFullScreen(!forceFullScreen)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="切换视图模式"
        >
          {forceFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{forceFullScreen ? '手机框模式' : '全屏模式'}</span>
        </button>
      </div>

      {/* Main Phone Chassis Container - seamlessly fills without white margins */}
      <div
        className={`relative flex flex-col bg-[#F2F2F7] transition-all duration-300 overflow-hidden ${
          forceFullScreen
            ? 'w-full h-full h-[100dvh] rounded-none border-0 shadow-none max-w-none'
            : 'w-full h-full h-[100dvh] sm:w-[390px] sm:h-full sm:max-h-[844px] sm:rounded-[48px] sm:border-[9px] sm:border-[#262629] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]'
        }`}
      >
        {/* Hardware volume and power button tabs on Desktop bezel */}
        {!forceFullScreen && (
          <>
            <div className="hidden sm:block absolute -left-[12px] top-[115px] w-[3px] h-[34px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden sm:block absolute -left-[12px] top-[162px] w-[3px] h-[52px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden sm:block absolute -left-[12px] top-[226px] w-[3px] h-[52px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden sm:block absolute -right-[12px] top-[170px] w-[3px] h-[78px] bg-[#3a3a3e] rounded-r-sm" />
          </>
        )}

        {/* Top Floating Status Bar */}
        {showStatusBar && (
          <div className="absolute top-0 left-0 right-0 h-11 z-50 pointer-events-none bg-transparent">
            <StatusBar />
          </div>
        )}

        {/* Dynamic App Content Canvas - fills 100% directly down to the bottom with no gap */}
        <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#F2F2F7]">
          {children}
        </div>
      </div>
    </div>
  );
};
