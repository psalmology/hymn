export type DesktopItemType = 'app' | 'widget';

export interface AppDefinition {
  id: string; // e.g. 'chat', 'personas', 'settings', 'moments', 'contacts', 'profile'
  name: string;
  description: string;
  gradient: string;
  iconName: string;
  category: 'core' | 'communication' | 'utility';
}

export interface WidgetDefinition {
  id: string;
  widgetType: 'profile-large' | 'profile-small' | 'stats-small';
  name: string;
  description: string;
  width: number; // 2 or 4
  height: number; // 2
}

export interface DesktopAppItem {
  id: string; // unique item instance id
  type: 'app';
  appId: string;
  x: number; // 0..3
  y: number; // 0..N
}

export interface DesktopWidgetItem {
  id: string; // unique item instance id
  type: 'widget';
  widgetType: 'profile-large' | 'profile-small' | 'stats-small';
  x: number; // 0..3
  y: number; // 0..N
  width: number; // 2 or 4
  height: number; // 2
}

export type DesktopItem = DesktopAppItem | DesktopWidgetItem;

export interface DesktopLayout {
  items: DesktopItem[];
  dock: string[]; // array of appId, e.g. ['chat', 'settings']
}
