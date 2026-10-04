import React, { useState, useRef } from 'react';
import { Camera, Plus, X, Image as ImageIcon } from 'lucide-react';

interface PublishMomentModalProps {
  onPublish: (content: string, images: string[]) => void;
  onClose: () => void;
}

// Compress moment image (max 800px, quality 0.8)
function compressMomentImage(file: File, maxDim: number = 800, quality: number = 0.8): Promise<string> {
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
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export const PublishMomentModal: React.FC<PublishMomentModalProps> = ({
  onPublish,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 9 - images.length;
    if (remainingSlots <= 0) return;

    setIsProcessing(true);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    try {
      const compressedList = await Promise.all(
        filesToProcess.map((f) => compressMomentImage(f, 800, 0.8))
      );
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Failed to compress moment images', err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const canPublish = content.trim().length > 0 || images.length > 0;

  const handlePublish = () => {
    if (!canPublish) return;
    onPublish(content.trim(), images);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7] select-none animate-in slide-in-from-bottom duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <div className="ios-safe-header pb-2 px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onClose}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
          >
            取消
          </button>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            发布动态
          </h2>
          <button
            type="button"
            disabled={!canPublish || isProcessing}
            onClick={handlePublish}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-end text-[15px] font-semibold transition-all cursor-pointer ${
              canPublish && !isProcessing
                ? 'text-neutral-900 active:opacity-60'
                : 'text-neutral-400 cursor-not-allowed'
            }`}
          >
            <span className={`px-3 py-1 rounded-full ${canPublish && !isProcessing ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-200 text-neutral-400'}`}>
              {isProcessing ? '处理中...' : '发布'}
            </span>
          </button>
        </div>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Textarea */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-black/[0.06]">
          <textarea
            autoFocus
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none resize-none leading-relaxed bg-transparent"
          />
        </div>

        {/* Images Grid */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-black/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-700">
              图片 ({images.length}/9)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden border border-black/10 shadow-2xs group"
              >
                <img
                  src={imgUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {images.length < 9 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <Plus size={22} />
                <span className="text-[11px] mt-1 font-medium">添加图片</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
