import { UserProfile, ChatThemeSettings } from '../types';

export const USER_PROFILE_STORAGE_KEY = 'ios_web_user_profile_v1';
export const FAVORITES_STORAGE_KEY = 'ios_web_favorites_v1';
export const CHAT_THEME_STORAGE_KEY = 'ios_web_chat_theme_v1';

export const DEFAULT_USER_PROFILE: UserProfile = {
  avatarUrl: '',
  nickname: 'iOS 用户',
  username: '@alex_chen',
  bio: '保持热爱，奔赴山海 ✨',
  postsCount: 0,
  contactsCount: 0,
  likesCount: 0,
};

export const DEFAULT_CHAT_THEME: ChatThemeSettings = {
  userBubbleColor: '#2C2C2E',
  assistantBubbleColor: '#FFFFFF',
  fontSize: 'medium',
  globalBackground: '#F2F2F7',
};

// 6 Grayscale presets for "我的气泡"
export const BUBBLE_PRESETS_USER = [
  { color: '#2C2C2E', name: '石板炭黑', isLightText: true },
  { color: '#3A3A3C', name: '深炭灰', isLightText: true },
  { color: '#48484A', name: '中炭灰', isLightText: true },
  { color: '#636366', name: '铅石灰', isLightText: true },
  { color: '#8E8E93', name: '冷灰', isLightText: true },
  { color: '#C7C7CC', name: '银浅灰', isLightText: false },
];

// 6 Grayscale presets for "对方气泡"
export const BUBBLE_PRESETS_ASSISTANT = [
  { color: '#FFFFFF', name: '纯净白', isLightText: false },
  { color: '#F2F2F7', name: '冰白灰', isLightText: false },
  { color: '#E5E5EA', name: '柔和浅灰', isLightText: false },
  { color: '#D1D1D6', name: '烟霭灰', isLightText: false },
  { color: '#C7C7CC', name: '中浅灰', isLightText: false },
  { color: '#AEAEB2', name: '沉稳灰', isLightText: true },
];

// Grayscale swatches for "全局默认聊天背景"
export const GLOBAL_BACKGROUND_PRESETS = [
  { color: '#F2F2F7', name: '系统原灰' },
  { color: '#FFFFFF', name: '极简纯白' },
  { color: '#EBEBF0', name: '银灰' },
  { color: '#DFE0E6', name: '冷雾灰' },
  { color: '#D4D5DC', name: '中灰' },
  { color: '#2C2C2E', name: '深黑夜' },
];
