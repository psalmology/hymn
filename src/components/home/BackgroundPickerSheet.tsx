import React, { useRef } from 'react';
import { Check, Image as ImageIcon, X } from 'lucide-react';
import { WidgetBgType } from '../../types/profileWidget';
import { ProfileCardBackground } from './ProfileCardBackground';

interface BackgroundPickerSheetProps {
  isOpen: boolean;
  currentBgType: WidgetBgType;
  customBgUrl?: string;
  onSelectPreset: (type: WidgetBgType) => void;
  onSelectCustomImage: (base64Url: string) => void;
  onError: (errMsg: string) => void;
  onClose: () => void;
}

const BG_PRESETS: Array<{ id: WidgetBgType; name: string }> = [
  { id: 'dots-stars', name: '圆点星星' },
  { id: 'pure-gray', name: '极简纯灰' },
  { id: 'gradient-gray', name: '渐变灰' },
  { id: 'grid-mesh', name: '小格子' },
  { id: 'stripe-texture', name: '斜纹理' },
];

// Compress background image (max dimension <= 800 per user requirement)
function compressBackgroundImage(
  file: File,
  maxDim: number = 800,
  quality: number = 0.8
): Promise<string> {
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

export const BackgroundPickerSheet: React.FC<BackgroundPickerSheetProps> = ({
  isOpen,
  currentBgType,
  customBgUrl,
  onSelectPreset,
  onSelectCustomImage,
  onError,
  onClose,
}) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressBackgroundImage(file, 800, 0.8);
      onSelectCustomImage(compressed);
    } catch (err) {
      console.error('Failed to compress background image', err);
      onError('图片过大，请换一张较小的图片');
    }
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <input
        ref={bgFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBgFileChange}
      />

      <div
        className="w-full sm:max-w-[340px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-neutral-900 leading-tight">
              更换名片背景
            </h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              点选内置灰调样式或相册自选图
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          {/* Preset Styles */}
          <div className="grid grid-cols-3 gap-2.5">
            {BG_PRESETS.map((preset) => {
              const isSelected = currentBgType === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`relative h-16 rounded-xl border overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-neutral-900 ring-2 ring-neutral-900/25 shadow-xs'
                      : 'border-black/10 hover:border-black/20'
                  }`}
                >
                  <ProfileCardBackground bgType={preset.id} />
                  <span className="relative z-10 text-[11px] font-semibold text-neutral-800 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-3xs">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 z-20 w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upload Custom Image Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => bgFileInputRef.current?.click()}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-medium transition-all cursor-pointer ${
                currentBgType === 'custom-image'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-black/10'
              }`}
            >
              <ImageIcon size={15} />
              <span>
                {currentBgType === 'custom-image'
                  ? '更换相册背景图片'
                  : '从相册选择图片作为背景'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-black/[0.06] bg-[#F9F9FB]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-[14px] font-medium text-neutral-700 bg-white border border-black/10 rounded-xl active:bg-neutral-100 transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
