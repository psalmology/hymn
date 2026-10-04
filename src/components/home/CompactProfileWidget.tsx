import React from 'react';
import { useChat } from '../../context/ChatContext';
import { WIDGET_STORAGE_KEY, DEFAULT_PROFILE_WIDGET, ProfileWidgetData } from '../../types/profileWidget';

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const CompactProfileWidget: React.FC = () => {
  const { userProfile } = useChat();

  const [widgetData, setWidgetData] = React.useState<ProfileWidgetData>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
        if (raw) return { ...DEFAULT_PROFILE_WIDGET, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROFILE_WIDGET;
  });

  const today = new Date();
  const dayName = WEEKDAYS_ZH[today.getDay()];
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  const avatar = widgetData.avatarUrl || userProfile.avatarUrl;
  const nickname = widgetData.nickname || userProfile.nickname || '我';
  const firstLetter = nickname.slice(0, 1);

  return (
    <div className="w-full h-full min-h-[148px] rounded-[26px] bg-white/75 backdrop-blur-xl border border-white/60 p-3.5 shadow-md shadow-black/5 flex flex-col justify-between overflow-hidden relative select-none">
      {/* Subtle background glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-neutral-300/30 blur-xl pointer-events-none" />

      {/* Top Header: Avatar & Mood */}
      <div className="flex items-center justify-between z-10">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-xs bg-[#D4D5DC] flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[15px] font-bold text-neutral-700">{firstLetter}</span>
          )}
        </div>
        <span className="text-[18px] select-none filter drop-shadow-xs">
          ✨
        </span>
      </div>

      {/* Bottom Area: Name & Date */}
      <div className="z-10 mt-auto pt-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-tight">
          <span>{dayName}</span>
          <span>•</span>
          <span>{dateStr}</span>
        </div>
        <h3 className="text-[15px] font-bold text-neutral-900 truncate leading-snug mt-0.5">
          {nickname}
        </h3>
        <p className="text-[11px] text-neutral-500 truncate leading-tight mt-0.5">
          {widgetData.signature || userProfile.bio || '保持热爱，奔赴山海 ✨'}
        </p>
      </div>
    </div>
  );
};
