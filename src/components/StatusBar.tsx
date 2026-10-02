import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface StatusBarProps {
  darkText?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ darkText = true }) => {
  const { isGenerating, activeApp } = useChat();
  const [timeStr, setTimeStr] = useState<string>('');
  const [batteryLevel] = useState<number>(98);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const textColorClass = darkText ? 'text-[#1c1c1e]' : 'text-neutral-900';

  return (
    <div
      className={`h-11 px-7 flex items-center justify-between select-none relative z-50 transition-colors duration-200 ${textColorClass}`}
    >
      {/* Left: Time */}
      <div className="w-16 flex items-center">
        <span className="text-[14px] font-semibold tracking-tight font-sans">
          {timeStr || '9:41'}
        </span>
      </div>

      {/* Center: Dynamic Island */}
      <div className="flex-1 flex justify-center items-center pointer-events-auto">
        <div
          className={`h-[26px] bg-black text-white rounded-full flex items-center justify-between px-3 transition-all duration-300 shadow-md ${
            isGenerating ? 'w-36 scale-102' : 'w-24'
          }`}
        >
          {/* Camera lens reflection */}
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#1c2938]" />
          </div>

          {/* Activity indicator in Dynamic Island */}
          {isGenerating ? (
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-ping" />
              <span className="font-medium tracking-tight">AI 思考中</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-black" />
          )}

          {/* Sensor indicator */}
          <div className="w-2 h-2 rounded-full bg-neutral-950" />
        </div>
      </div>

      {/* Right: Cellular, WiFi, Battery */}
      <div className="w-16 flex items-center justify-end gap-1.5">
        {/* Cellular 4 bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <span className="w-[3px] h-1 bg-current rounded-xs" />
          <span className="w-[3px] h-1.5 bg-current rounded-xs" />
          <span className="w-[3px] h-2.5 bg-current rounded-xs" />
          <span className="w-[3px] h-3 bg-current rounded-xs" />
        </div>

        {/* WiFi */}
        <Wifi size={13} strokeWidth={2.4} />

        {/* Battery */}
        <div className="flex items-center gap-0.5 ml-0.5">
          <div className="w-[20px] h-[10px] border border-current rounded-[3px] p-[1px] flex items-center">
            <div
              className="h-full bg-current rounded-[1.5px] transition-all"
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <div className="w-[1px] h-[3.5px] bg-current rounded-r-xs" />
        </div>
      </div>
    </div>
  );
};
