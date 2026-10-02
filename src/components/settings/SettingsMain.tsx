import React from 'react';
import { Key, Database, Info, ChevronRight, ChevronLeft, Smartphone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const SettingsMain: React.FC = () => {
  const {
    setSettingsSubView,
    activeProfile,
    apiProfiles,
    conversations,
    goHome,
    showStatusBar,
    setShowStatusBar,
  } = useChat();

  const totalConversations = conversations?.length || 0;
  const totalMessages = (conversations || []).reduce(
    (acc, curr) => acc + (curr.messages?.length || 0),
    0
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center h-8 mb-1">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1.5 cursor-pointer"
            title="返回桌面 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>返回</span>
          </button>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          设置
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Group 1: 界面与显示 (iOS 风格状态栏开关) */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            界面与显示
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            <div className="w-full px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-700 text-white flex items-center justify-center shadow-xs">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    显示状态栏
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    显示顶部灵动岛、时间与电池电量
                  </p>
                </div>
              </div>

              {/* iOS Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={showStatusBar}
                onClick={() => setShowStatusBar(!showStatusBar)}
                className={`w-12 h-7 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
                  showStatusBar ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                }`}
                title={showStatusBar ? '点击关闭状态栏' : '点击开启状态栏'}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                    showStatusBar ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Group 2: 服务与模型 */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            服务与模型
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={() => setSettingsSubView('api')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-800 text-white flex items-center justify-center shadow-xs">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    API 与模型配置
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5 truncate max-w-[210px]">
                    {activeProfile
                      ? `${activeProfile.name} (${activeProfile.model || '未选模型'})`
                      : '未配置 API'}
                    {' · '}
                    {apiProfiles.length}套配置
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Group 3: 数据与存储 */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            数据与存储
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={() => setSettingsSubView('data')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-600 text-white flex items-center justify-center shadow-xs">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    数据管理与清理
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    {conversations.length} 个对话 · {totalMessages} 条记录
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Group 4: 系统关于 */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            系统信息
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            <button
              type="button"
              onClick={() => setSettingsSubView('about')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-400 text-white flex items-center justify-center shadow-xs">
                  <Info size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    关于本应用
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    iOS 灰度极简设计 · 本地隐私安全
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
