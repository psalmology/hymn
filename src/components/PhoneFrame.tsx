import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from './StatusBar';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  const [forceFullScreen, setForceFullScreen] = useState(false);
  const {
    showStatusBar,
    activeApp,
    chatSubView,
    currentConversation,
    chatTheme,
  } = useChat();

  // Determine current active page theme background
  const activeBgColor = useMemo(() => {
    if (activeApp === 'home') {
      return '#ced0d7';
    }
    if (activeApp === 'calculator' || activeApp === 'clock' || activeApp === 'weather') {
      return '#1C1C1E';
    }
    if (activeApp === 'chat' && chatSubView === 'room') {
      return (
        currentConversation?.settings?.chatBackground ||
        chatTheme.globalBackground ||
        '#F2F2F7'
      );
    }
    return '#F2F2F7';
  }, [activeApp, chatSubView, currentConversation, chatTheme]);

  // Sync background color with document body and HTML on mobile
  useEffect(() => {
    document.body.style.backgroundColor = activeBgColor;
    document.documentElement.style.backgroundColor = activeBgColor;
  }, [activeBgColor]);

  // Visual Viewport tracking for iOS Safari keyboard adaptation
  useEffect(() => {
    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv && window.innerWidth <= 500) {
        document.documentElement.style.setProperty('--app-height', `${vv.height}px`);
        // Keep document scroll locked at top to prevent iOS rubberband/distortion
        window.scrollTo(0, 0);
      } else {
        document.documentElement.style.removeProperty('--app-height');
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="w-full h-full h-[100dvh] flex items-center justify-center p-0 min-[501px]:p-3 select-none relative overflow-hidden font-sans transition-colors duration-200"
      style={{
        height: 'var(--app-height, 100dvh)',
        backgroundColor: activeBgColor,
      }}
    >
      {/* Viewport Mode Switcher for Desktop */}
      <div className="hidden min-[501px]:flex absolute top-3 right-4 z-50 items-center gap-1.5 bg-neutral-800/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-neutral-700/60 shadow-md">
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

      {/* Main Phone Chassis Container - on real phone (<=500px) fills 100% borderless, on desktop (>500px) displays phone bezel */}
      <div
        className={`relative flex flex-col transition-all duration-300 overflow-hidden w-full h-full ${
          forceFullScreen
            ? 'rounded-none border-0 shadow-none max-w-none'
            : 'rounded-none border-0 shadow-none min-[501px]:w-[390px] min-[501px]:h-full min-[501px]:max-h-[844px] min-[501px]:rounded-[48px] min-[501px]:border-[9px] min-[501px]:border-[#262629] min-[501px]:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]'
        }`}
        style={{
          height: 'var(--app-height, 100dvh)',
          backgroundColor: activeBgColor,
        }}
      >
        {/* Hardware volume and power button tabs on Desktop bezel */}
        {!forceFullScreen && (
          <>
            <div className="hidden min-[501px]:block absolute -left-[12px] top-[115px] w-[3px] h-[34px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden min-[501px]:block absolute -left-[12px] top-[162px] w-[3px] h-[52px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden min-[501px]:block absolute -left-[12px] top-[226px] w-[3px] h-[52px] bg-[#3a3a3e] rounded-l-sm" />
            <div className="hidden min-[501px]:block absolute -right-[12px] top-[170px] w-[3px] h-[78px] bg-[#3a3a3e] rounded-r-sm" />
          </>
        )}

        {/* Top Floating Status Bar - only displayed on Desktop (>500px). Real mobile phones use native OS status bar */}
        {showStatusBar && (
          <div className="hidden min-[501px]:block absolute top-0 left-0 right-0 h-11 z-50 pointer-events-none bg-transparent">
            <StatusBar />
          </div>
        )}

        {/* Dynamic App Content Canvas - fills 100% directly down to the bottom with no gap */}
        <div
          className="w-full h-full relative overflow-hidden flex flex-col transition-colors duration-200"
          style={{ backgroundColor: activeBgColor }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
