import React, { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Check,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  ListFilter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ApiProfile } from '../../types';
import { POPULAR_PRESETS } from '../../constants/presets';
import {
  fetchModelsList,
  testApiConnection,
  TestResult,
  normalizeBaseUrl,
} from '../../services/apiService';
import { IOSAlert } from '../common/IOSAlert';

export const ApiSettingsView: React.FC = () => {
  const {
    setSettingsSubView,
    apiProfiles,
    activeProfileId,
    setActiveProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    updateProfileCachedModels,
    showStatusBar,
  } = useChat();

  // Mode: 'list' | 'edit'
  const [editorMode, setEditorMode] = useState<'list' | 'edit'>('list');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Form state for adding / editing
  const [formName, setFormName] = useState('');
  const [formBaseURL, setFormBaseURL] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formModel, setFormModel] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Model fetching & picking state
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Testing connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Delete confirmation
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingProfileId(null);
    setFormName('自定义 API');
    setFormBaseURL('');
    setFormApiKey('');
    setFormModel('');
    setAvailableModels([]);
    setModelsError(null);
    setTestResult(null);
    setShowModelPicker(false);
    setEditorMode('edit');
  };

  const handleOpenEdit = (profile: ApiProfile) => {
    setEditingProfileId(profile.id);
    setFormName(profile.name || 'API 配置');
    setFormBaseURL(profile.baseURL || '');
    setFormApiKey(profile.apiKey || '');
    setFormModel(profile.model || '');
    setAvailableModels(profile.cachedModels || []);
    setModelsError(null);
    setTestResult(null);
    setShowModelPicker(false);
    setEditorMode('edit');
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = POPULAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.id === 'custom') {
      setFormName('自定义 API');
      setFormBaseURL('');
      setFormModel('');
    } else {
      setFormName(preset.name);
      setFormBaseURL(preset.baseURL);
      setFormModel(preset.defaultModel);
    }
    setModelsError(null);
    setTestResult(null);
    showToast(`已应用 ${preset.name} 模板`);
  };

  const handleFetchModels = async () => {
    if (!formBaseURL.trim()) {
      setModelsError('请先填写 API 地址 (Base URL)。可以手动输入模型名。');
      return;
    }
    if (!formApiKey.trim()) {
      setModelsError('请先填写 API Key。可以手动输入模型名。');
      return;
    }

    setIsFetchingModels(true);
    setModelsError(null);
    try {
      const models = await fetchModelsList(formBaseURL, formApiKey);
      setAvailableModels(models);
      setShowModelPicker(true);

      // If current formModel is empty and we got models, set first one
      if (!formModel && models.length > 0) {
        setFormModel(models[0]);
      }

      // If currently editing a profile, update its cache
      if (editingProfileId) {
        updateProfileCachedModels(editingProfileId, models);
      }
      showToast(`已获取 ${models.length} 个模型`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取模型列表失败，可以手动输入模型名。';
      setModelsError(msg);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveProfile = () => {
    const cleanName = formName.trim() || '自定义 API';
    const cleanBaseURL = normalizeBaseUrl(formBaseURL);
    const cleanApiKey = formApiKey.trim();
    const cleanModel = formModel.trim() || 'gpt-4o-mini';

    if (editingProfileId) {
      updateProfile(editingProfileId, {
        name: cleanName,
        baseURL: cleanBaseURL,
        apiKey: cleanApiKey,
        model: cleanModel,
        cachedModels: availableModels,
      });
      showToast('配置已更新');
    } else {
      const newId = addProfile({
        name: cleanName,
        baseURL: cleanBaseURL,
        apiKey: cleanApiKey,
        model: cleanModel,
        cachedModels: availableModels,
      });
      setActiveProfile(newId);
      showToast('新配置已保存并设为当前使用');
    }

    setEditorMode('list');
  };

  const handleTestInEditor = async () => {
    setTesting(true);
    setTestResult(null);

    const tempProfile: ApiProfile = {
      id: 'temp_test',
      name: formName,
      baseURL: formBaseURL,
      apiKey: formApiKey,
      model: formModel || 'gpt-4o-mini',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const res = await testApiConnection(tempProfile);
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : '测试发生了未知异常。',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestInList = async (profile: ApiProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testApiConnection(profile);
      setTestResult(res);
      if (res.success) {
        showToast(`「${profile.name}」测试成功 (${res.latencyMs}ms)`);
      } else {
        showToast(`「${profile.name}」连接失败`);
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : '测试异常',
      });
    } finally {
      setTesting(false);
    }
  };

  const filteredModels = availableModels.filter((m) =>
    m.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-neutral-900/90 text-white text-[12px] font-medium rounded-full shadow-lg backdrop-blur-md animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* ===================== MODE 1: PROFILES LIST ===================== */}
      {editorMode === 'list' && (
        <>
          {/* Header */}
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
                API 配置管理
              </h2>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs cursor-pointer"
                title="新增配置"
              >
                <Plus size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Explanatory hint */}
            <p className="text-[12px] text-neutral-500 px-1 leading-normal">
              支持保存多套 API。点击卡片可即刻切换当前聊天使用的配置，带有勾选标记的为生效中配置。
            </p>

            {/* Profiles List */}
            <div>
              <div className="flex items-center justify-between px-3 pb-1.5">
                <span className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  已保存的配置 ({apiProfiles.length})
                </span>
                <span className="text-[11px] text-neutral-400">点击切换</span>
              </div>

              <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
                {apiProfiles.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400">
                    <p className="text-[14px]">暂无 API 配置</p>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="mt-3 px-4 py-2 bg-neutral-900 text-white rounded-xl text-[13px] font-medium active:scale-95"
                    >
                      立即添加第一个 API
                    </button>
                  </div>
                ) : (
                  apiProfiles.map((profile) => {
                    const isActive = profile.id === activeProfileId;
                    return (
                      <div
                        key={profile.id}
                        onClick={() => {
                          setActiveProfile(profile.id);
                          showToast(`已切换使用: ${profile.name}`);
                        }}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isActive ? 'bg-neutral-50/90' : 'active:bg-neutral-50'
                        }`}
                      >
                        {/* Left: Active radio/check */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                              isActive
                                ? 'bg-neutral-900 border-neutral-900 text-white'
                                : 'border-neutral-300 bg-white text-transparent'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[15px] font-semibold text-neutral-900 truncate">
                                {profile.name}
                              </h4>
                              {isActive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 font-medium">
                                  使用中
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-neutral-400 font-mono truncate mt-0.5">
                              {profile.baseURL || '未填地址'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F2F2F7] text-neutral-700 font-medium truncate max-w-[140px]">
                                {profile.model || '未配模型'}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {profile.apiKey ? 'Key已配置' : '⚠️ 缺少Key'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Test connection icon button */}
                          <button
                            type="button"
                            onClick={(e) => handleTestInList(profile, e)}
                            className="p-2 text-neutral-400 hover:text-neutral-700 active:scale-90 transition-transform cursor-pointer"
                            title="测试此配置"
                          >
                            <Sparkles size={16} />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(profile);
                            }}
                            className="p-2 text-neutral-500 hover:text-neutral-900 active:scale-90 transition-transform cursor-pointer"
                            title="编辑配置"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileToDelete(profile.id);
                            }}
                            className="p-2 text-neutral-300 hover:text-red-500 active:scale-90 transition-transform cursor-pointer"
                            title="删除配置"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Test result box in list view if tested */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl border text-[13px] leading-relaxed shadow-2xs ${
                  testResult.success
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-red-50/90 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-600 shrink-0" />
                    )}
                    <span>{testResult.success ? '测试通过' : '测试失败'}</span>
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <span className="text-[11px] font-mono font-normal text-neutral-500">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] whitespace-pre-wrap break-words">
                  {testResult.message}
                </p>
                {testResult.preview && (
                  <p className="mt-1 text-[11px] italic text-neutral-600">
                    回复预览: "{testResult.preview}"
                  </p>
                )}
              </div>
            )}

            {/* Add profile button card */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full py-3.5 bg-white border border-dashed border-neutral-300 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-medium text-neutral-800 hover:bg-neutral-50 active:scale-98 transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={16} />
              <span>添加新 API 配置</span>
            </button>
          </div>
        </>
      )}

      {/* ===================== MODE 2: PROFILE EDITOR ===================== */}
      {editorMode === 'edit' && (
        <>
          {/* Header */}
          <div className="pt-11 px-3 bg-white/90 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 shrink-0">
            <div className="h-11 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditorMode('list')}
                className="flex items-center text-[15px] font-normal text-neutral-600 hover:text-neutral-900 active:opacity-60 transition-opacity -ml-1 cursor-pointer"
              >
                <ChevronLeft size={22} className="-mr-1 text-neutral-600" />
                <span>取消</span>
              </button>

              <h2 className="text-[15px] font-semibold text-neutral-900">
                {editingProfileId ? '编辑 API 配置' : '新建 API 配置'}
              </h2>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="text-[15px] font-semibold text-neutral-900 hover:text-black active:opacity-60 transition-opacity cursor-pointer mr-1"
              >
                保存
              </button>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Quick Templates */}
            <div>
              <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
                选择模板或快速填入
              </p>
              <div className="flex flex-wrap gap-1.5 px-1">
                {POPULAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="px-3 py-1.5 text-[12px] rounded-xl font-medium bg-white text-neutral-700 border border-black/[0.08] hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-3xs"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Group 1: Name, Base URL, API Key */}
            <div>
              <p className="text-[12px] font-medium text-neutral-500 uppercase px-3 pb-1.5 tracking-wider">
                接口基础参数
              </p>
              <div className="bg-white rounded-2xl shadow-xs overflow-hidden divide-y divide-black/[0.06]">
                {/* Profile Name */}
                <div className="p-3.5 flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-neutral-800">
                    配置名称
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例如: 我的智谱、个人 OpenAI、本地模型"
                    className="w-full text-[14px] text-neutral-900 bg-[#F4F4F6] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-neutral-400 select-text"
                  />
                </div>

                {/* Base URL */}
                <div className="p-3.5 flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-neutral-800">
                    API 地址 (Base URL)
                  </label>
                  <input
                    type="text"
                    value={formBaseURL}
                    onChange={(e) => setFormBaseURL(e.target.value)}
                    placeholder="https://open.bigmodel.cn/api/paas/v4"
                    className="w-full text-[14px] font-mono text-neutral-900 bg-[#F4F4F6] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-neutral-400 select-text"
                  />
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    示例: https://open.bigmodel.cn/api/paas/v4（末尾斜杠会自动剔除并拼接 /chat/completions）
                  </p>
                </div>

                {/* API Key */}
                <div className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-neutral-800">
                      API Key (密钥)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showKey ? '隐藏' : '显示'}</span>
                    </button>
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-[14px] font-mono text-neutral-900 bg-[#F4F4F6] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-neutral-400 select-text"
                  />
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    仅保存在您的本地浏览器中，绝不上传到任何中间服务器。
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs Group 2: Model Name with Dual Mode (Fetch / Manual) */}
            <div>
              <div className="flex items-center justify-between px-3 pb-1.5">
                <span className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  模型配置 (双向支持)
                </span>
                {availableModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
                  >
                    {showModelPicker ? '收起列表' : `已缓存 ${availableModels.length} 个模型 ▼`}
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xs overflow-hidden p-3.5 space-y-3">
                {/* Manual Input Field */}
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                    模型名称 (可手动输入或点选列表)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="例如: glm-4-flash、deepseek-chat、gpt-4o-mini"
                      className="flex-1 text-[14px] font-mono text-neutral-900 bg-[#F4F4F6] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-neutral-400 select-text"
                    />

                    {/* Fetch Models button */}
                    <button
                      type="button"
                      disabled={isFetchingModels}
                      onClick={handleFetchModels}
                      className={`px-3 py-2 rounded-xl text-[12px] font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isFetchingModels
                          ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
                      }`}
                    >
                      {isFetchingModels ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>获取中...</span>
                        </>
                      ) : (
                        <>
                          <ListFilter size={13} />
                          <span>获取模型列表</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Fetch Error Display */}
                {modelsError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[12px] flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <p>{modelsError}</p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        提示：部分服务商未开放 /models 接口或存在跨域限制，您可以直接在上方输入框手动输入模型名称。
                      </p>
                    </div>
                  </div>
                )}

                {/* Model Selector Sheet / List */}
                {(showModelPicker || availableModels.length > 0) && (
                  <div className="pt-2 border-t border-black/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium text-neutral-700 flex items-center gap-1">
                        <span>可选模型列表</span>
                        <span className="text-[11px] text-neutral-400">
                          (点击直接选中填入)
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={handleFetchModels}
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer"
                        title="刷新模型列表"
                      >
                        <RefreshCw size={11} />
                        <span>重新获取</span>
                      </button>
                    </div>

                    {/* Search in model list */}
                    <div className="relative mb-2">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        placeholder="搜索模型 (例如 glm, deepseek, 4o)..."
                        className="w-full text-[12px] bg-[#F4F4F6] rounded-lg pl-8 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-neutral-400"
                      />
                    </div>

                    {/* Scrollable Model Chips/Rows */}
                    <div className="max-h-44 overflow-y-auto divide-y divide-black/[0.04] border border-black/[0.06] rounded-xl bg-neutral-50/50">
                      {filteredModels.length === 0 ? (
                        <div className="p-3 text-center text-[12px] text-neutral-400">
                          未找到匹配的模型
                        </div>
                      ) : (
                        filteredModels.map((m) => {
                          const isSelected = formModel === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setFormModel(m);
                                showToast(`已选模型: ${m}`);
                              }}
                              className={`w-full px-3 py-2 text-left text-[12px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-neutral-200/90 text-neutral-900 font-semibold'
                                  : 'hover:bg-white active:bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              <span className="truncate">{m}</span>
                              {isSelected && (
                                <Check size={13} className="text-neutral-900 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                type="button"
                disabled={testing}
                onClick={handleTestInEditor}
                className={`w-full py-3 rounded-2xl font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  testing
                    ? 'bg-neutral-300 text-neutral-500'
                    : 'bg-neutral-800 text-white active:scale-98 hover:bg-neutral-700'
                }`}
              >
                {testing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>正在测试连接...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>测试此配置连接</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl border text-[13px] leading-relaxed shadow-2xs ${
                  testResult.success
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-red-50/90 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-600 shrink-0" />
                    )}
                    <span>{testResult.success ? '连接成功' : '连接失败'}</span>
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <span className="text-[11px] font-mono font-normal text-neutral-500">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] whitespace-pre-wrap break-words">
                  {testResult.message}
                </p>
                {testResult.preview && (
                  <p className="mt-1 text-[11px] italic text-neutral-600">
                    回复预览: "{testResult.preview}"
                  </p>
                )}
              </div>
            )}

            {/* Save Button */}
            <div>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-2xl font-semibold text-[15px] shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                保存此配置
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Alert */}
      <IOSAlert
        isOpen={Boolean(profileToDelete)}
        title="确认删除该配置？"
        message="删除后将从本地保存列表中移除该套 API 配置。"
        confirmText="删除"
        cancelText="取消"
        isDestructive
        onConfirm={() => {
          if (profileToDelete) {
            deleteProfile(profileToDelete);
            setProfileToDelete(null);
            showToast('配置已删除');
          }
        }}
        onCancel={() => setProfileToDelete(null)}
      />
    </div>
  );
};
