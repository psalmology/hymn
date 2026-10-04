import React from 'react';
import { Check, Plus, X, User } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface AccountSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlt: () => void;
}

export const AccountSwitcherSheet: React.FC<AccountSwitcherSheetProps> = ({
  isOpen,
  onClose,
  onCreateAlt,
}) => {
  const { accounts, activeAccountId, switchAccount } = useChat();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[80vh] bg-[#F2F2F7] rounded-t-[28px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 border-t border-white/40"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* Top Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-black/[0.06] shrink-0">
          <div>
            <h3 className="text-[17px] font-bold text-neutral-900 leading-tight">
              切换账号
            </h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              各账号拥有独立的好友、聊天与动态
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-200/80 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {accounts.map((account) => {
              const isActive = account.id === activeAccountId;
              const firstLetter = (account.nickname || '用').slice(0, 1);

              return (
                <div
                  key={account.id}
                  onClick={() => {
                    if (!isActive) {
                      switchAccount(account.id);
                    }
                    onClose();
                  }}
                  className={`p-3.5 flex items-center justify-between gap-3 active:bg-neutral-50 transition-colors cursor-pointer select-none ${
                    isActive ? 'bg-neutral-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#D4D5DC] flex items-center justify-center shrink-0 border border-black/[0.06] shadow-2xs">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[17px] font-bold text-neutral-700">
                          {firstLetter}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                          {account.nickname}
                        </h4>
                        {account.isMain ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-100 text-neutral-600 font-medium shrink-0">
                            主号
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-500 font-medium shrink-0">
                            小号
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-400 font-mono truncate mt-0.5">
                        {account.username || '@user'}
                      </p>
                    </div>
                  </div>

                  {/* Active Checkmark */}
                  {isActive && (
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create Alt Account Button at Bottom of List */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateAlt();
            }}
            className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 text-neutral-900 font-semibold text-[15px] rounded-2xl shadow-xs border border-black/[0.04] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>创建小号</span>
          </button>
        </div>
      </div>
    </div>
  );
};
