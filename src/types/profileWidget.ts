export type WidgetBgType =
  | 'dots-stars'
  | 'pure-gray'
  | 'gradient-gray'
  | 'grid-mesh'
  | 'stripe-texture'
  | 'custom-image';

export interface ProfileWidgetData {
  avatarUrl: string; // Base64 data URL or empty string
  nickname: string;
  signature: string;
  bgType: WidgetBgType;
  customBgUrl?: string; // Base64 data URL if bgType === 'custom-image'
}

export const DEFAULT_PROFILE_WIDGET: ProfileWidgetData = {
  avatarUrl: '',
  nickname: 'iOS 助理',
  signature: '保持热爱，奔赴山海 ✨',
  bgType: 'dots-stars',
  customBgUrl: '',
};

export const WIDGET_STORAGE_KEY = 'ios_web_profile_widget_v1';
