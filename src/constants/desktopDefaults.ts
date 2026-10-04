import { AppDefinition, WidgetDefinition, DesktopLayout, DesktopItem } from '../types/desktop';

export const DESKTOP_STORAGE_KEY = 'ios_desktop_layout_v2';

export const AVAILABLE_APPS: AppDefinition[] = [
  {
    id: 'chat',
    name: '聊天',
    description: 'AI 角色即时多轮对话与消息互动',
    gradient: 'from-[#3a3a3c] to-[#1c1c1e]',
    iconName: 'MessageSquare',
    category: 'core',
  },
  {
    id: 'personas',
    name: '人设库',
    description: '自定义 AI 角色性格设定与背景',
    gradient: 'from-[#555559] to-[#38383b]',
    iconName: 'BookUser',
    category: 'core',
  },
  {
    id: 'settings',
    name: '设置',
    description: 'API 接口管理与系统外观偏好',
    gradient: 'from-[#8e8e93] to-[#636366]',
    iconName: 'Settings',
    category: 'utility',
  },
  {
    id: 'moments',
    name: '动态',
    description: '社交圈子与角色朋友圈互动',
    gradient: 'from-[#48484a] to-[#242426]',
    iconName: 'Aperture',
    category: 'communication',
  },
  {
    id: 'contacts',
    name: '通讯录',
    description: '好友与专属 AI 角色联系人列表',
    gradient: 'from-[#636366] to-[#3a3a3c]',
    iconName: 'Users',
    category: 'communication',
  },
  {
    id: 'profile',
    name: '个人主页',
    description: '个人资料卡、收藏与美化设置',
    gradient: 'from-[#7c7c80] to-[#48484a]',
    iconName: 'User',
    category: 'utility',
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '深灰底圆形按键、四则运算与历史记录',
    gradient: 'from-[#3a3a3c] to-[#1c1c1e]',
    iconName: 'Calculator',
    category: 'utility',
  },
  {
    id: 'notes',
    name: '备忘录',
    description: '快速记事、置顶与全文即时检索',
    gradient: 'from-[#636366] to-[#3a3a3c]',
    iconName: 'FileText',
    category: 'utility',
  },
  {
    id: 'reminders',
    name: '提醒事项',
    description: '待办任务、定时提醒与清单管理',
    gradient: 'from-[#48484a] to-[#2c2c2e]',
    iconName: 'CheckCircle2',
    category: 'utility',
  },
  {
    id: 'clock',
    name: '时钟',
    description: '世界时钟、精准秒表与倒计时器',
    gradient: 'from-[#3a3a3c] to-[#1c1c1e]',
    iconName: 'Clock',
    category: 'utility',
  },
  {
    id: 'weather',
    name: '天气',
    description: '全球实时气温与未来多日预报',
    gradient: 'from-[#48484a] to-[#2c2c2e]',
    iconName: 'CloudSun',
    category: 'utility',
  },
];

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'widget-profile-large',
    widgetType: 'profile-large',
    name: '个人卡片 (大尺寸)',
    description: '4×2 横幅，展示头像、打卡日历、心情与自定义背景',
    width: 4,
    height: 2,
  },
  {
    id: 'widget-profile-small',
    widgetType: 'profile-small',
    name: '个人速览 (小尺寸)',
    description: '2×2 方块，展示头像、今日星期与心情状态',
    width: 2,
    height: 2,
  },
  {
    id: 'widget-stats-small',
    widgetType: 'stats-small',
    name: '状态统计 (小尺寸)',
    description: '2×2 方块，展示对话、人设与动态统计数据',
    width: 2,
    height: 2,
  },
];

export const DEFAULT_DESKTOP_LAYOUT: DesktopLayout = {
  items: [
    {
      id: 'widget_profile_initial',
      type: 'widget',
      widgetType: 'profile-large',
      x: 0,
      y: 0,
      width: 4,
      height: 2,
    },
    {
      id: 'app_chat_initial',
      type: 'app',
      appId: 'chat',
      x: 0,
      y: 2,
    },
    {
      id: 'app_personas_initial',
      type: 'app',
      appId: 'personas',
      x: 1,
      y: 2,
    },
    {
      id: 'app_settings_initial',
      type: 'app',
      appId: 'settings',
      x: 2,
      y: 2,
    },
    {
      id: 'app_calculator_initial',
      type: 'app',
      appId: 'calculator',
      x: 3,
      y: 2,
    },
    {
      id: 'app_notes_initial',
      type: 'app',
      appId: 'notes',
      x: 0,
      y: 3,
    },
    {
      id: 'app_reminders_initial',
      type: 'app',
      appId: 'reminders',
      x: 1,
      y: 3,
    },
    {
      id: 'app_clock_initial',
      type: 'app',
      appId: 'clock',
      x: 2,
      y: 3,
    },
    {
      id: 'app_weather_initial',
      type: 'app',
      appId: 'weather',
      x: 3,
      y: 3,
    },
  ],
  dock: ['chat', 'settings'],
};

/**
 * Checks whether a given grid cell area (width x height starting at x, y) is occupied by any item.
 */
export function isAreaOccupied(
  items: DesktopItem[],
  x: number,
  y: number,
  w: number = 1,
  h: number = 1,
  ignoreId?: string
): boolean {
  if (x < 0 || x + w > 4 || y < 0) return true;

  for (const item of items) {
    if (ignoreId && item.id === ignoreId) continue;
    const itemW = item.type === 'widget' ? item.width : 1;
    const itemH = item.type === 'widget' ? item.height : 1;

    // Check rectangle overlap
    const noOverlap =
      x + w <= item.x ||
      item.x + itemW <= x ||
      y + h <= item.y ||
      item.y + itemH <= y;

    if (!noOverlap) return true;
  }
  return false;
}

/**
 * Finds the first available free slot for an item of given dimensions (w x h).
 */
export function findFirstFreeSlot(
  items: DesktopItem[],
  w: number = 1,
  h: number = 1
): { x: number; y: number } {
  const maxSearchRows = 10;
  for (let r = 0; r < maxSearchRows; r++) {
    for (let c = 0; c <= 4 - w; c++) {
      if (!isAreaOccupied(items, c, r, w, h)) {
        return { x: c, y: r };
      }
    }
  }
  return { x: 0, y: 3 };
}

/**
 * Safely moves or swaps an item to target (targetX, targetY), resolving collisions automatically.
 */
export function placeItemOnGrid(
  items: DesktopItem[],
  movingItem: DesktopItem,
  rawTargetX: number,
  rawTargetY: number
): DesktopItem[] {
  const w = movingItem.type === 'widget' ? movingItem.width : 1;
  const h = movingItem.type === 'widget' ? movingItem.height : 1;

  // Clamp target coordinates within 4-column bounds
  const targetX = Math.max(0, Math.min(4 - w, rawTargetX));
  const targetY = Math.max(0, rawTargetY);

  // If already at target position, return unchanged
  if (movingItem.x === targetX && movingItem.y === targetY) {
    return items;
  }

  // Find colliding items
  const otherItems = items.filter((i) => i.id !== movingItem.id);
  const collidingItems = otherItems.filter((item) => {
    const itemW = item.type === 'widget' ? item.width : 1;
    const itemH = item.type === 'widget' ? item.height : 1;
    const noOverlap =
      targetX + w <= item.x ||
      item.x + itemW <= targetX ||
      targetY + h <= item.y ||
      item.y + itemH <= targetY;
    return !noOverlap;
  });

  const updatedMovingItem = {
    ...movingItem,
    x: targetX,
    y: targetY,
  };

  // Case 1: No collision, clean placement
  if (collidingItems.length === 0) {
    return [...otherItems, updatedMovingItem];
  }

  // Case 2: 1 colliding item and both are 1x1 apps -> SWAP positions!
  if (
    collidingItems.length === 1 &&
    w === 1 &&
    h === 1 &&
    collidingItems[0].type === 'app'
  ) {
    const swappedCollidingItem = {
      ...collidingItems[0],
      x: movingItem.x,
      y: movingItem.y,
    };
    return otherItems
      .map((item) => (item.id === collidingItems[0].id ? swappedCollidingItem : item))
      .concat(updatedMovingItem);
  }

  // Case 3: Widget or multiple collisions -> Place moving item, relocate colliding items to nearest free spots
  const result: DesktopItem[] = [updatedMovingItem];
  const itemsToPlace = [...collidingItems];
  const unaffected = otherItems.filter((i) => !collidingItems.some((c) => c.id === i.id));
  result.push(...unaffected);

  for (const item of itemsToPlace) {
    const itemW = item.type === 'widget' ? item.width : 1;
    const itemH = item.type === 'widget' ? item.height : 1;
    const freeSlot = findFirstFreeSlot(result, itemW, itemH);
    result.push({
      ...item,
      x: freeSlot.x,
      y: freeSlot.y,
    });
  }

  return result;
}

