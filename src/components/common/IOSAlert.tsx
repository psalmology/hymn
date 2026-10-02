import React from 'react';

interface IOSAlertProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const IOSAlert: React.FC<IOSAlertProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[270px] bg-white/95 dark:bg-[#252528]/95 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 text-center animate-in zoom-in-95 duration-200">
        <div className="px-4 pt-5 pb-4">
          <h4 className="text-[17px] font-semibold text-neutral-900 dark:text-white leading-tight">
            {title}
          </h4>
          {message && (
            <p className="mt-1.5 text-[13px] text-neutral-500 dark:text-neutral-400 leading-normal">
              {message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-black/[0.08] dark:border-white/[0.1] divide-x divide-black/[0.08] dark:divide-white/[0.1]">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 text-[16px] font-normal text-neutral-600 dark:text-neutral-300 active:bg-black/[0.05] dark:active:bg-white/[0.05] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-3 text-[16px] font-semibold active:bg-black/[0.05] dark:active:bg-white/[0.05] transition-colors ${
              isDestructive
                ? 'text-red-500 hover:text-red-600'
                : 'text-neutral-900 dark:text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
