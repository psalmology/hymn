import React, { useState } from 'react';
import {
  X,
  Plus,
  Check,
  RotateCcw,
  MessageSquare,
  Settings as SettingsIcon,
  BookUser,
  Aperture,
  Users,
  User,
  LayoutGrid,
  Sparkles,
  Calculator,
  FileText,
  CheckCircle2,
  Clock as ClockIcon,
  CloudSun,
} from 'lucide-react';
import { AVAILABLE_APPS, AVAILABLE_WIDGETS } from '../../constants/desktopDefaults';
import { DesktopItem, DesktopLayout } from '../../types/desktop';
import { IOSAlert } from '../common/IOSAlert';

interface EditDesktopSheetProps {
  isOpen: boolean;
  onClose: () => void;
  layout: DesktopLayout;
  onAddApp: (appId: string) => void;
  onAddWidget: (widgetType: 'profile-large' | 'profile-small' | 'stats-small') => void;
  onResetLayout: () => void;
}

export const EditDesktopSheet: React.FC<EditDesktopSheetProps> = ({
  isOpen,
  onClose,
  layout,
  onAddApp,
  onAddWidget,
  onResetLayout,
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'widgets'>('apps');
  const [showResetAlert, setShowResetAlert] = useState(false);

  if (!isOpen) return null;

  // Determine which apps are currently on desktop or dock
  const isAppAdded = (appId: string) => {
    const onDesktop = layout.items.some(
      (item) => item.type === 'app' && item.appId === appId
    );
    const onDock = layout.dock.includes(appId);
    return onDesktop || onDock;
  };

  // Determine which widgets are currently on desktop
  const isWidgetAdded = (widgetType: string) => {
    return layout.items.some(
      (item) => item.type === 'widget' && item.widgetType === widgetType
    );
  };

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare size={22} strokeWidth={2.1} />;
      case 'BookUser':
        return <BookUser size={22} strokeWidth={2.1} />;
      case 'Settings':
        return <SettingsIcon size={22} strokeWidth={2.1} />;
      case 'Aperture':
        return <Aperture size={22} strokeWidth={2.1} />;
      case 'Users':
        return <Users size={22} strokeWidth={2.1} />;
      case 'User':
        return <User size={22} strokeWidth={2.1} />;
      case 'Calculator':
        return <Calculator size={22} strokeWidth={2.1} />;
      case 'FileText':
        return <FileText size={22} strokeWidth={2.1} />;
      case 'CheckCircle2':
        return <CheckCircle2 size={22} strokeWidth={2.1} />;
      case 'Clock':
        return <ClockIcon size={22} strokeWidth={2.1} />;
      case 'CloudSun':
        return <CloudSun size={22} strokeWidth={2.1} />;
      default:
        return <MessageSquare size={22} strokeWidth={2.1} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[82vh] bg-[#F2F2F7] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-white/40"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        {/* Top Handle Bar */}
        <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-2 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900 tracking-tight">
              编辑桌面
            </h2>
            <p className="text-[12px] text-neutral-500">
              添加或整理应用与小组件
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Switcher: 应用 | 小组件 */}
        <div className="px-5 py-2 shrink-0">
          <div className="p-1 bg-[#E3E3E8] rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('apps')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'apps'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              应用列表
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('widgets')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'widgets'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              小组件库
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5">
          {activeTab === 'apps' && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-neutral-400 uppercase px-1">
                所有可用应用
              </p>
              <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.05]">
                {AVAILABLE_APPS.map((app) => {
                  const added = isAppAdded(app.id);
                  return (
                    <div
                      key={app.id}
                      className="p-3.5 flex items-center justify-between gap-3"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-[22%] bg-gradient-to-b ${app.gradient} text-white flex items-center justify-center shadow-xs border border-white/20 shrink-0`}
                        >
                          {getAppIcon(app.iconName)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                            {app.name}
                          </h4>
                          <p className="text-[12px] text-neutral-500 truncate mt-0.5">
                            {app.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Add or Added state */}
                      <div className="shrink-0">
                        {added ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-400 text-[12px] font-medium">
                            <Check size={13} strokeWidth={2.5} />
                            <span>已在桌面</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddApp(app.id)}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>添加</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-neutral-400 uppercase px-1">
                所有可用小组件
              </p>
              <div className="space-y-2.5">
                {AVAILABLE_WIDGETS.map((w) => {
                  const added = isWidgetAdded(w.widgetType);
                  return (
                    <div
                      key={w.id}
                      className="bg-white rounded-2xl p-4 shadow-xs border border-black/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-[13px] border border-black/5 shrink-0">
                          {w.width}×{w.height}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                              {w.name}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-mono">
                              {w.width === 4 ? '横幅' : '方块'}
                            </span>
                          </div>
                          <p className="text-[12px] text-neutral-500 truncate mt-0.5">
                            {w.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {added ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-400 text-[12px] font-medium">
                            <Check size={13} strokeWidth={2.5} />
                            <span>已添加</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddWidget(w.widgetType)}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>添加</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset Desktop Layout Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowResetAlert(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white/70 hover:bg-white text-neutral-600 hover:text-neutral-900 text-[13px] font-medium flex items-center justify-center gap-2 border border-black/[0.06] active:scale-98 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>恢复默认桌面布局</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Alert */}
      <IOSAlert
        isOpen={showResetAlert}
        title="恢复默认布局"
        message="确定要将桌面恢复为出厂默认排列吗？应用数据不会受到任何影响。"
        confirmText="恢复默认"
        cancelText="取消"
        isDestructive={false}
        onConfirm={() => {
          onResetLayout();
          setShowResetAlert(false);
        }}
        onCancel={() => setShowResetAlert(false)}
      />
    </div>
  );
};
