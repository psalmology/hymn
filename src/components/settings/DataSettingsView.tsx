import React, { useState } from 'react';
import {
  ChevronLeft,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export const DataSettingsView: React.FC = () => {
  const {
    setSettingsSubView,
    conversations,
    clearAllConversations,
    exportConversations,
    importConversations,
    showStatusBar,
  } = useChat();

  const [showAlert, setShowAlert] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const totalConversations = conversations?.length || 0;
  const totalMessages = (conversations || []).reduce(
    (acc, curr) => acc + (curr.messages?.length || 0),
    0
  );

  // Calculate approximate storage usage
  const approximateStorageKb = Math.round(
    JSON.stringify(conversations || []).length / 1024
  );

  const handleClearConfirm = () => {
    clearAllConversations();
    setShowAlert(false);
    setSuccessToast('聊天记录已清空');
    setTimeout(() => setSuccessToast(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importConversations(parsed);
        if (ok) {
          setSuccessToast('备份导入成功');
          setTimeout(() => setSuccessToast(null), 2000);
        } else {
          alert('导入失败：文件格式不匹配。');
        }
      } catch {
        alert('导入失败：不是有效的 JSON 文件。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Navigation Header */}
      <div className="pt-11 px-3 bg-white/90 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSettingsSubView('main')}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-neutral-900 active:opacity-60 transition-opacity -ml-1 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>设置</span>
          </button>

          <h2 className="text-[15px] font-semibold text-neutral-900">
            数据管理
          </h2>

          <div className="w-12 flex justify-end">
            {successToast && (
              <span className="text-[11px] text-emerald-600 font-medium">
                {successToast}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Statistics Card */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            存储使用统计
          </p>
          <div className="bg-white rounded-2xl shadow-xs p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <HardDrive size={20} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-neutral-900">
                  本地 LocalStorage
                </p>
                <p className="text-[12px] text-neutral-400">
                  {conversations.length} 个对话 · {totalMessages} 条消息
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[15px] font-mono font-medium text-neutral-800">
                {approximateStorageKb} KB
              </span>
              <p className="text-[11px] text-neutral-400">占用大小</p>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            备份与恢复
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={exportConversations}
              className="w-full px-4 py-3 flex items-center justify-between active:bg-neutral-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Download size={17} className="text-neutral-600" />
                <span className="text-[14px] text-neutral-800 font-medium">
                  导出所有聊天记录 (JSON)
                </span>
              </div>
            </button>

            <label className="w-full px-4 py-3 flex items-center justify-between active:bg-neutral-50 transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-3">
                <Upload size={17} className="text-neutral-600" />
                <span className="text-[14px] text-neutral-800 font-medium">
                  导入聊天记录文件
                </span>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <p className="text-[12px] font-medium text-red-600 uppercase px-3 pb-1.5 tracking-wider">
            危险操作
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAlert(true)}
              className="w-full px-4 py-3.5 flex items-center justify-center gap-2 text-red-500 hover:text-red-600 active:bg-red-50 transition-colors text-[15px] font-medium cursor-pointer"
            >
              <Trash2 size={17} />
              <span>清除所有聊天记录</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 px-3 mt-1.5 leading-normal">
            点击将永久清除本地保存的所有会话记录，操作无法恢复。
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <IOSAlert
        isOpen={showAlert}
        title="清除所有聊天记录？"
        message="所有历史会话和聊天消息将被永久清空，此操作不可撤销。"
        confirmText="清除全部"
        cancelText="取消"
        isDestructive
        onConfirm={handleClearConfirm}
        onCancel={() => setShowAlert(false)}
      />
    </div>
  );
};
