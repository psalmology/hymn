import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, RotateCcw, AlertCircle } from 'lucide-react';
import {
  ProfileWidgetData,
  WidgetBgType,
  DEFAULT_PROFILE_WIDGET,
  WIDGET_STORAGE_KEY,
} from '../../types/profileWidget';
import { ProfileCardBackground } from './ProfileCardBackground';
import { BackgroundPickerSheet } from './BackgroundPickerSheet';
import { IOSAlert } from '../common/IOSAlert';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Compress image utility to keep within localStorage limits (maxDim <= 400 for avatar)
function compressAvatarImage(file: File, maxDim: number = 400, quality: number = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export const ProfileWidget: React.FC = () => {
  // Toast notification for errors or messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 1. Data State with LocalStorage sync
  const [data, setData] = useState<ProfileWidgetData>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...DEFAULT_PROFILE_WIDGET, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Storage read restricted for widget', e);
    }
    return DEFAULT_PROFILE_WIDGET;
  });

  const updateData = (updates: Partial<ProfileWidgetData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      try {
        if (typeof window !== 'undefined' && 'localStorage' in window) {
          localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next));
        }
      } catch (e) {
        console.error('Failed to save widget data to localStorage', e);
        showToast('图片过大，请换一张较小的图片');
        return prev; // keep previous state if storage exceeded
      }
      return next;
    });
  };

  // 2. Track today's day of week: 0 (Sun) - 6 (Sat) with auto-midnight update
  const [currentDay, setCurrentDay] = useState<number>(() => new Date().getDay());

  useEffect(() => {
    const checkMidnight = () => {
      const nowDay = new Date().getDay();
      setCurrentDay((prev) => (prev !== nowDay ? nowDay : prev));
    };
    const interval = setInterval(checkMidnight, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // 3. Inline editing states for Nickname and Signature
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [signatureInput, setSignatureInput] = useState('');

  // 4. Popups & Sheets
  const [avatarMenuPos, setAvatarMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [bgMenuPos, setBgMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [showResetBgAlert, setShowResetBgAlert] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Handle Nickname finish
  const handleFinishNickname = () => {
    const trimmed = nicknameInput.trim();
    if (trimmed && trimmed !== data.nickname) {
      updateData({ nickname: trimmed });
    }
    setIsEditingNickname(false);
  };

  // Handle Signature finish
  const handleFinishSignature = () => {
    const trimmed = signatureInput.trim();
    if (trimmed && trimmed !== data.signature) {
      updateData({ signature: trimmed });
    }
    setIsEditingSignature(false);
  };

  // Avatar file upload
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file, 400, 0.88);
      updateData({ avatarUrl: compressed });
    } catch (err) {
      console.error('Failed to compress avatar', err);
      showToast('图片过大，请换一张较小的图片');
    }
    e.target.value = '';
  };

  // Click on background of the card
  const handleCardBackgroundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditingNickname || isEditingSignature) return;

    setAvatarMenuPos(null);

    // Position menu near the click coordinates
    const x = e.clientX;
    const y = e.clientY;

    setBgMenuPos({ x, y });
  };

  const firstLetter = (data.nickname?.trim() || '用').slice(0, 1);

  return (
    <div className="relative w-full z-10 px-2 pt-1 select-none">
      {/* Toast Notification for Quota / Errors */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white text-[13px] px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Main Card Container (Clicking blank area triggers background menu) */}
      <div
        ref={cardContainerRef}
        onClick={handleCardBackgroundClick}
        className="relative w-full rounded-[26px] p-4 border border-white/70 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer transition-all"
      >
        {/* Background Layer (All internal elements have pointer-events-none) */}
        <ProfileCardBackground
          bgType={data.bgType}
          customBgUrl={data.customBgUrl}
        />

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col justify-between">
          {/* Top Profile Header */}
          <div className="flex items-center gap-3.5">
            {/* Avatar (Clickable: Menu for Replace / Reset) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setBgMenuPos(null);
                const rect = e.currentTarget.getBoundingClientRect();
                setAvatarMenuPos({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + 8,
                });
              }}
              className="w-[52px] h-[52px] rounded-full shrink-0 overflow-hidden border-[1.5px] border-white/80 shadow-2xs bg-[#D4D5DC] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={data.nickname}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <span className="text-[20px] font-bold text-neutral-700 pointer-events-none">
                  {firstLetter}
                </span>
              )}
            </div>

            {/* Nickname & Signature (Inline editable) */}
            <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
              {/* Nickname: Inline editable */}
              {isEditingNickname ? (
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishNickname();
                    if (e.key === 'Escape') setIsEditingNickname(false);
                  }}
                  onBlur={handleFinishNickname}
                  onClick={(e) => e.stopPropagation()}
                  ref={(input) => {
                    if (input) {
                      const len = input.value.length;
                      input.setSelectionRange(len, len);
                    }
                  }}
                  className="text-[16px] font-bold text-neutral-900 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-black/20 outline-none shadow-2xs w-full cursor-text"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarMenuPos(null);
                    setBgMenuPos(null);
                    setNicknameInput(data.nickname);
                    setIsEditingNickname(true);
                  }}
                  className="text-[17px] font-bold text-neutral-900 tracking-tight truncate leading-snug cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {data.nickname || '未设置昵称'}
                </h3>
              )}

              {/* Signature: Inline editable */}
              {isEditingSignature ? (
                <input
                  type="text"
                  autoFocus
                  maxLength={60}
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishSignature();
                    if (e.key === 'Escape') setIsEditingSignature(false);
                  }}
                  onBlur={handleFinishSignature}
                  onClick={(e) => e.stopPropagation()}
                  ref={(input) => {
                    if (input) {
                      const len = input.value.length;
                      input.setSelectionRange(len, len);
                    }
                  }}
                  className="text-[12px] font-normal text-neutral-800 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-black/20 outline-none shadow-2xs w-full mt-1 cursor-text"
                />
              ) : (
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarMenuPos(null);
                    setBgMenuPos(null);
                    setSignatureInput(data.signature);
                    setIsEditingSignature(true);
                  }}
                  className="text-[12px] text-neutral-500 font-normal truncate mt-0.5 leading-snug cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {data.signature || '这个人很低调，什么也没留下'}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Weekday Capsule Bar (Click has NO action and stops propagation) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 w-full bg-black/[0.04] rounded-full p-1 flex items-center justify-between border border-black/[0.03] cursor-default"
          >
            {WEEKDAYS.map((day, idx) => {
              const isToday = idx === currentDay;
              return (
                <div
                  key={day}
                  className={`flex-1 text-center py-1 transition-all rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-[#2C2C2E] text-white font-bold text-[10px] tracking-wide shadow-2xs'
                      : 'text-neutral-500 font-medium text-[10px] tracking-tight'
                  }`}
                >
                  <span>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transparent Click Backdrop to dismiss popup menus */}
      {(avatarMenuPos || bgMenuPos) && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setAvatarMenuPos(null);
            setBgMenuPos(null);
          }}
        />
      )}

      {/* Avatar iOS Popup Menu */}
      {avatarMenuPos && (
        <div
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(Math.max(avatarMenuPos.x, 80), window.innerWidth - 80)}px`,
            top: `${Math.min(Math.max(avatarMenuPos.y, 40), window.innerHeight - 100)}px`,
            transform: 'translate(-50%, 0)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-black/10 rounded-2xl shadow-xl p-1 min-w-[145px] text-neutral-900 divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={() => {
                setAvatarMenuPos(null);
                avatarInputRef.current?.click();
              }}
              className="w-full px-3 py-2 text-[13px] font-medium text-neutral-800 hover:text-black flex items-center gap-2 rounded-xl active:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Camera size={14} className="text-neutral-500" />
              <span>更换头像</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAvatarMenuPos(null);
                updateData({ avatarUrl: '' });
              }}
              className="w-full px-3 py-2 text-[13px] font-medium text-neutral-800 hover:text-black flex items-center gap-2 rounded-xl active:bg-neutral-100 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="text-neutral-500" />
              <span>恢复默认头像</span>
            </button>
          </div>
        </div>
      )}

      {/* Background iOS Popup Menu */}
      {bgMenuPos && (
        <div
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(Math.max(bgMenuPos.x, 85), window.innerWidth - 85)}px`,
            top: `${Math.min(Math.max(bgMenuPos.y - 35, 75), window.innerHeight - 100)}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-black/10 rounded-2xl shadow-xl p-1 min-w-[145px] text-neutral-900 divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={() => {
                setBgMenuPos(null);
                setIsBgPickerOpen(true);
              }}
              className="w-full px-3 py-2 text-[13px] font-medium text-neutral-800 hover:text-black flex items-center gap-2 rounded-xl active:bg-neutral-100 transition-colors cursor-pointer"
            >
              <ImageIcon size={14} className="text-neutral-500" />
              <span>更换背景</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBgMenuPos(null);
                setShowResetBgAlert(true);
              }}
              className="w-full px-3 py-2 text-[13px] font-medium text-neutral-800 hover:text-black flex items-center gap-2 rounded-xl active:bg-neutral-100 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="text-neutral-500" />
              <span>恢复默认背景</span>
            </button>
          </div>
        </div>
      )}

      {/* Background Selection Panel Sheet */}
      <BackgroundPickerSheet
        isOpen={isBgPickerOpen}
        currentBgType={data.bgType}
        customBgUrl={data.customBgUrl}
        onSelectPreset={(type) => {
          updateData({ bgType: type, customBgUrl: type === 'custom-image' ? data.customBgUrl : undefined });
        }}
        onSelectCustomImage={(base64Url) => {
          updateData({ bgType: 'custom-image', customBgUrl: base64Url });
        }}
        onError={(errMsg) => {
          showToast(errMsg);
        }}
        onClose={() => setIsBgPickerOpen(false)}
      />

      {/* Reset Background Secondary Confirmation Alert */}
      <IOSAlert
        isOpen={showResetBgAlert}
        title="恢复默认背景"
        message="确定要恢复默认的名片背景样式吗？"
        confirmText="恢复"
        cancelText="取消"
        isDestructive={false}
        onConfirm={() => {
          updateData({ bgType: 'dots-stars', customBgUrl: '' });
          setShowResetBgAlert(false);
        }}
        onCancel={() => setShowResetBgAlert(false)}
      />
    </div>
  );
};
