import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Pin,
  Trash2,
  Palette,
  BookUser,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import {
  CHAT_BACKGROUND_PRESETS,
  DEFAULT_CHARACTER_SETTINGS,
} from '../../constants/characterSettings';
import { IOSAlert } from '../common/IOSAlert';

export const CharacterSettingsView: React.FC = () => {
  const {
    currentConversation,
    personas,
    setChatSubView,
    updateConversationRemark,
    updateCharacterSettings,
    clearConversationMessages,
    deleteConversation,
  } = useChat();

  const settings = currentConversation?.settings || DEFAULT_CHARACTER_SETTINGS;

  // Edit Remark Modal
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');

  // Alerts for Clear & Delete
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!currentConversation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F2F2F7] p-6 text-neutral-500">
        <p>未选择任何角色</p>
        <button
          type="button"
          onClick={() => setChatSubView('list')}
          className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] rounded-full cursor-pointer"
        >
          返回会话列表
        </button>
      </div>
    );
  }

  const handleOpenRemarkModal = () => {
    setRemarkInput(currentConversation.remark || currentConversation.title || '');
    setIsEditingRemark(true);
  };

  const handleSaveRemark = () => {
    updateConversationRemark(currentConversation.id, remarkInput);
    setIsEditingRemark(false);
  };

  // Find bound persona if any
  const boundPersona = currentConversation.personaId
    ? personas.find((p) => p.id === currentConversation.personaId)
    : undefined;

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Top Header - status bar space reserved */}
      <div className="ios-safe-header px-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
        <div className="h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setChatSubView('room')}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 shrink-0 cursor-pointer"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
            <span>聊天</span>
          </button>

          <h2 className="text-[16px] font-semibold text-neutral-900 truncate">
            聊天设置
          </h2>

          <div className="w-12 shrink-0" />
        </div>
      </div>

      <div className="p-4 space-y-5 pb-6">
        {/* ================= 第一组: 角色信息 (备注 & 当前人设只读) ================= */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            角色信息
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {/* 1. 备注 */}
            <button
              type="button"
              onClick={handleOpenRemarkModal}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-800 text-white flex items-center justify-center shadow-xs">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    备注名
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    聊天顶部标题与会话列表显示
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] text-neutral-600 truncate max-w-[120px]">
                  {currentConversation.remark || currentConversation.title || '设置备注'}
                </span>
                <ChevronRight size={16} className="text-neutral-400" />
              </div>
            </button>

            {/* 2. 当前人设 (只读展示，不可在这里编辑) */}
            <div className="w-full px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-600 text-white flex items-center justify-center shadow-xs">
                  <BookUser size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    当前人设
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    绑定的人设库专属设定
                  </p>
                </div>
              </div>
              <div className="text-[14px] font-medium text-neutral-700">
                {boundPersona ? boundPersona.name : '无'}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 第二组: 对话行为 (立即回复 & 多条回复) ================= */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            对话行为
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {/* 3. 发送后立即回复开关 */}
            <div className="w-full px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                  发送后立即回复
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  开启后点击发送立即触发 AI 回复
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCharacterSettings(currentConversation.id, {
                    autoReplyOnSend: !(settings.autoReplyOnSend !== false),
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out p-0.5 cursor-pointer ${
                  settings.autoReplyOnSend !== false ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.autoReplyOnSend !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. 允许发送多条回复开关 */}
            <div className="w-full px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                  允许发送多条回复
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  像真实聊天一样分成多条短消息逐个弹出
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCharacterSettings(currentConversation.id, {
                    allowMultipleBubbles: !settings.allowMultipleBubbles,
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out p-0.5 cursor-pointer ${
                  settings.allowMultipleBubbles ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.allowMultipleBubbles ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ================= 第三组: 界面与个性化 (置顶 & 聊天背景) ================= */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            个性化设置
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {/* 5. 置顶聊天开关 */}
            <div className="w-full px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-700 text-white flex items-center justify-center shadow-xs">
                  <Pin size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    置顶聊天
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    在会话列表最上方优先展示
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCharacterSettings(currentConversation.id, {
                    isPinned: !settings.isPinned,
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out p-0.5 cursor-pointer ${
                  settings.isPinned ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.isPinned ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. 聊天背景选择器 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-neutral-500" />
                  <span className="text-[14px] font-medium text-neutral-800">
                    聊天背景颜色
                  </span>
                </div>
                <span className="text-[12px] text-neutral-400">
                  {CHAT_BACKGROUND_PRESETS.find((p) => p.id === (settings.chatBackground || ''))
                    ?.name || '默认'}
                </span>
              </div>

              {/* 8 个精选灰调色块 + 默认 */}
              <div className="grid grid-cols-4 gap-2.5">
                {CHAT_BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = (settings.chatBackground || '') === preset.id;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        updateCharacterSettings(currentConversation.id, {
                          chatBackground: preset.id,
                        })
                      }
                      style={{ backgroundColor: preset.color }}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center relative border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <span className="text-[10px] font-medium text-neutral-700">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                          <Check size={9} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 第四组: 动态与互动设置 ================= */}
        <div>
          <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
            动态与互动设置
          </p>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {/* 1. 允许角色自动互动 (默认关闭) */}
            <div className="w-full px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                  允许角色自动互动
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  发布动态后，角色会以符合人设的口吻自动点赞或写评论
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCharacterSettings(currentConversation.id, {
                    autoInteractMoments: !settings.autoInteractMoments,
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out p-0.5 cursor-pointer shrink-0 ml-3 ${
                  settings.autoInteractMoments ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.autoInteractMoments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. 允许角色自动发动态 (默认关闭) */}
            <div className="w-full px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-medium text-neutral-900 leading-tight">
                    允许角色自动发动态
                  </h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    开启后角色会按照指定频率自动在动态圈发布新内容
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCharacterSettings(currentConversation.id, {
                      autoPostMoments: !settings.autoPostMoments,
                    })
                  }
                  className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out p-0.5 cursor-pointer shrink-0 ml-3 ${
                    settings.autoPostMoments ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.autoPostMoments ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider for Frequency (1 ~ 1000 mins) */}
              {settings.autoPostMoments && (
                <div className="pt-2 border-t border-black/[0.04] space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-neutral-600 font-medium">发布频率</span>
                    <span className="font-semibold text-neutral-900">
                      每 {settings.autoPostIntervalMinutes || 60} 分钟
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    value={settings.autoPostIntervalMinutes || 60}
                    onChange={(e) =>
                      updateCharacterSettings(currentConversation.id, {
                        autoPostIntervalMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                    <span>1 分钟</span>
                    <span>500 分钟</span>
                    <span>1000 分钟</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 第五组: 操作项 (清空记录 & 删除角色) ================= */}
        <div>
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
            {/* 7. 清空聊天记录 */}
            <button
              type="button"
              onClick={() => setShowClearAlert(true)}
              className="w-full px-4 py-3.5 text-center text-[15px] font-medium text-red-600 active:bg-neutral-50 transition-colors cursor-pointer"
            >
              清空聊天记录
            </button>

            {/* 8. 删除角色 */}
            <button
              type="button"
              onClick={() => setShowDeleteAlert(true)}
              className="w-full px-4 py-3.5 text-center text-[15px] font-semibold text-[#FF3B30] active:bg-neutral-50 transition-colors cursor-pointer"
            >
              删除角色
            </button>
          </div>
        </div>
      </div>

      {/* Edit Remark Modal */}
      {isEditingRemark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-[280px] bg-white/95 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-black/10 text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">
              修改角色备注名
            </h3>
            <p className="text-[12px] text-neutral-500 mb-3">
              为该对话角色设置一个专属称呼
            </p>
            <input
              type="text"
              autoFocus
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder={currentConversation.title}
              className="w-full px-3 py-2 text-[14px] bg-[#E9E9EE] rounded-xl text-neutral-900 outline-none focus:ring-1 focus:ring-black/20 mb-3 text-center"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingRemark(false)}
                className="flex-1 py-2 text-[13px] font-medium text-neutral-600 bg-neutral-100 rounded-xl active:bg-neutral-200 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveRemark}
                className="flex-1 py-2 text-[13px] font-semibold text-white bg-neutral-900 rounded-xl active:scale-98 cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Messages Confirmation */}
      <IOSAlert
        isOpen={showClearAlert}
        title="清空聊天记录"
        message="确定要清空与该角色的所有聊天记录吗？此操作无法撤销。"
        confirmText="清空"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          clearConversationMessages(currentConversation.id);
          setShowClearAlert(false);
        }}
        onCancel={() => setShowClearAlert(false)}
      />

      {/* Delete Character Confirmation */}
      <IOSAlert
        isOpen={showDeleteAlert}
        title="删除角色"
        message="确定要删除该角色吗？此操作将永久删除此角色及其所有聊天记录和独立设置。"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          deleteConversation(currentConversation.id);
          setShowDeleteAlert(false);
        }}
        onCancel={() => setShowDeleteAlert(false)}
      />
    </div>
  );
};
