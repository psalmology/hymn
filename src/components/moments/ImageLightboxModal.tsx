import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-150 select-none p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-12 right-5 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer z-10"
      >
        <X size={18} />
      </button>

      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
