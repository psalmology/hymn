import { ProviderPreset, ApiSettings, ApiProfile } from '../types';

export const DEFAULT_API_SETTINGS: ApiSettings = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  systemPrompt: '你是基于 iOS 极简系统打造的智能助手，请用简练、得体、严谨的中文回答用户的问题。',
};

export const INITIAL_DEFAULT_PROFILE: ApiProfile = {
  id: 'profile_zhipu_default',
  name: '我的智谱',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '',
  model: 'glm-4-flash',
  temperature: 0.7,
  createdAt: Date.now() - 1000 * 60 * 60,
  updatedAt: Date.now() - 1000 * 60 * 60,
};

export const POPULAR_PRESETS: ProviderPreset[] = [
  {
    id: 'custom',
    name: '自定义 API',
    baseURL: '',
    defaultModel: '',
    note: '完全自定义填写服务商地址、API Key 与模型名称',
  },
  {
    id: 'zhipu',
    name: '智谱 AI (BigModel)',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    note: '开放平台 OpenAI 兼容接口，支持获取模型列表及 glm-4 系列',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    note: '官方高速 API，性价比极高，支持 deepseek-chat 及 deepseek-reasoner',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (聚合推荐)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    note: '原生完美支持浏览器 CORS 跨域，可调用全球主流大模型',
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    baseURL: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    note: '国内高速免翻，原生支持 CORS，新用户有免费赠送额度',
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    note: '支持 gpt-4o-mini、gpt-4o 等，需境外网络直连或代理',
  },
  {
    id: 'moonshot',
    name: 'Kimi (Moonshot)',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    note: '月之暗面长文本模型',
  },
  {
    id: 'ollama',
    name: 'Ollama 本地运行',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    note: '本地离线运行，需配置 OLLAMA_ORIGINS="*" 以允许浏览器访问',
  },
];
