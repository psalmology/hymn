export interface ChatQuote {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  error?: string;
  failed?: boolean;
  quote?: ChatQuote;
}

export type ReplyLength = 'short' | 'medium' | 'detailed';
export type SpeakingStyle = 'natural' | 'lively' | 'gentle' | 'formal';

export interface Persona {
  id: string;
  name: string;
  description: string; // 人设内容
  avatarUrl?: string; // 角色头像
  bio?: string; // 个性签名
  createdAt: number;
  updatedAt: number;
}

export interface CharacterChatSettings {
  autoReplyOnSend?: boolean; // 发送后立即回复 (默认 true)
  allowMultipleBubbles?: boolean; // 允许发送多条回复 (默认 false)
  isPinned?: boolean; // 置顶聊天 (默认 false)
  chatBackground?: string; // 聊天背景色 ('' 为默认 #F2F2F7)
  avatarUrl?: string;
  bio?: string;
  autoInteractMoments?: boolean; // 允许角色自动互动 (默认 false)
  autoPostMoments?: boolean; // 允许角色自动发动态 (默认 false)
  autoPostIntervalMinutes?: number; // 频率 (最低1分钟，最高1000分钟，默认 60)
  lastAutoPostTime?: number; // 上次自动发动态时间戳
  // Deprecated fields kept for backward compatibility and migration
  characterPrompt?: string;
  replyLength?: ReplyLength;
  speakingStyle?: SpeakingStyle;
}

export interface MomentLike {
  authorId: string; // 'user' or conversationId
  authorName: string;
}

export interface MomentComment {
  id: string;
  authorId: string; // 'user' or conversationId
  authorName: string;
  replyToName?: string; // e.g. '温柔助理'
  content: string;
  createdAt: number;
}

export interface Moment {
  id: string;
  authorId: string; // 'user' or conversationId
  authorName: string;
  authorAvatar?: string;
  isUser: boolean; // 是否是我发布的
  content: string;
  images: string[]; // 最多9张图片
  likes: MomentLike[];
  comments: MomentComment[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  remark?: string; // 角色备注名
  personaId?: string; // 绑定的专属人设 ID
  settings?: CharacterChatSettings; // 角色独立设置
  avatarUrl?: string; // 角色头像
  bio?: string; // 个性签名
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ApiProfile {
  id: string;
  name: string; // e.g. "我的智谱", "DeepSeek", "生产环境 OpenAI"
  baseURL: string; // e.g. "https://open.bigmodel.cn/api/paas/v4"
  apiKey: string;
  model: string;
  cachedModels?: string[]; // Cached list of models returned from /models
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiSettings {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt: string;
}

export type ActiveApp = 'home' | 'chat' | 'settings' | 'personas';

export type PersonaSubView = 'list' | 'create' | 'detail';

export type SettingsSubView = 'main' | 'api' | 'data' | 'about';

export type ChatSubView = 'list' | 'room' | 'settings';

export type ChatTab = 'messages' | 'contacts' | 'moments' | 'profile';

export type ProfileSubView = 'main' | 'edit' | 'favorites' | 'aesthetics' | 'view_profile';

export interface UserProfile {
  avatarUrl: string;
  nickname: string;
  username: string; // e.g. "@alex_chen"
  bio: string;
  postsCount: number;
  contactsCount: number;
  likesCount: number;
}

export interface FavoriteMessage {
  id: string;
  messageId: string;
  conversationId: string;
  characterName: string;
  content: string;
  timestamp: number;
}

export type ChatFontSize = 'small' | 'medium' | 'large';

export interface ChatThemeSettings {
  userBubbleColor: string;
  assistantBubbleColor: string;
  fontSize: ChatFontSize;
  globalBackground: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseURL: string;
  defaultModel: string;
  note: string;
}
