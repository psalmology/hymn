import { CharacterChatSettings } from '../types';

export const DEFAULT_CHARACTER_SETTINGS: CharacterChatSettings = {
  autoReplyOnSend: true,
  allowMultipleBubbles: false,
  isPinned: false,
  chatBackground: '',
};

export interface BackgroundPreset {
  id: string;
  name: string;
  color: string;
  border: string;
  textDark?: boolean;
}

export const CHAT_BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: '', name: '默认', color: '#F2F2F7', border: '#E5E5EA' },
  { id: '#FAFAFA', name: '浅素灰', color: '#FAFAFA', border: '#E5E5E5' },
  { id: '#F0F1F4', name: '银灰', color: '#F0F1F4', border: '#DFE1E6' },
  { id: '#ECEAE6', name: '暖灰', color: '#ECEAE6', border: '#DDD9D3' },
  { id: '#E6E8EC', name: '雾灰', color: '#E6E8EC', border: '#D5D9E0' },
  { id: '#DFE1E5', name: '烟灰', color: '#DFE1E5', border: '#CFD2D8' },
  { id: '#D5D8DC', name: '石板灰', color: '#D5D8DC', border: '#C4C8CE' },
  { id: '#CBCED3', name: '水泥灰', color: '#CBCED3', border: '#B8BCC3' },
];

export function composeUserInfoPrompt(user?: {
  nickname?: string;
  bio?: string;
  bioDetails?: string;
}): string {
  if (!user) return '';
  const parts: string[] = [];

  const nick = user.nickname?.trim();
  if (nick) {
    parts.push(`和你聊天的人昵称是 ${nick}`);
  }

  const bio = user.bio?.trim();
  if (bio) {
    parts.push(`个性签名是 ${bio}`);
  }

  const details = user.bioDetails?.trim();
  if (details) {
    parts.push(`自我介绍：${details}`);
  }

  if (parts.length === 0) return '';
  return parts.join('，');
}

/**
 * 【system 提示的组合规则】
 * 发给 AI 的 system 提示由以下部分拼接，空的部分跳过：
 * 角色的人设内容 + 多条回复规则（沿用原有设置）+ 对方信息（"和你聊天的人昵称是 X，个性签名是 Y，自我介绍：Z"，取该聊天所属账号的资料）。
 */
export function composeSystemPrompt(
  personaDescription?: string,
  allowMultipleBubbles?: boolean,
  baseProfilePrompt?: string,
  user?: {
    nickname?: string;
    bio?: string;
    bioDetails?: string;
  }
): string {
  const parts: string[] = [];

  // 1. Base API Profile prompt if any
  if (baseProfilePrompt?.trim()) {
    parts.push(baseProfilePrompt.trim());
  }

  // 2. 人设内容 (来自绑定的人设库人设)
  if (personaDescription?.trim()) {
    parts.push(`【角色设定】\n${personaDescription.trim()}`);
  }

  // 3. 多条回复规则 (若开启)
  if (allowMultipleBubbles) {
    parts.push(
      '【多条消息回复规则】请像真实即时通讯聊天一样，使用 `|||` 将你的回复分割成 2 到 4 条短消息发送。例如："第一句话。|||第二句话。"'
    );
  }

  // 4. 对方信息 (取该聊天所属账号的资料)
  const userInfo = composeUserInfoPrompt(user);
  if (userInfo) {
    parts.push(userInfo);
  }

  return parts.join('\n\n');
}
