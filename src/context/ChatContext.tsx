import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveApp,
  ApiProfile,
  ApiSettings,
  ChatMessage,
  ChatQuote,
  ChatSubView,
  Conversation,
  SettingsSubView,
  CharacterChatSettings,
  Persona,
  PersonaSubView,
  ChatTab,
  ProfileSubView,
  UserProfile,
  FavoriteMessage,
  ChatThemeSettings,
  Moment,
  MomentComment,
  MomentLike,
} from '../types';
import { DEFAULT_API_SETTINGS, INITIAL_DEFAULT_PROFILE } from '../constants/presets';
import { DEFAULT_CHARACTER_SETTINGS, composeSystemPrompt } from '../constants/characterSettings';
import {
  USER_PROFILE_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  CHAT_THEME_STORAGE_KEY,
  DEFAULT_USER_PROFILE,
  DEFAULT_CHAT_THEME,
} from '../constants/themeDefaults';
import {
  MOMENTS_STORAGE_KEY,
  MOMENTS_COVER_STORAGE_KEY,
  INITIAL_STARTER_MOMENTS,
} from '../constants/momentsDefaults';
import { sendChatCompletion } from '../services/apiService';

const CONVERSATIONS_STORAGE_KEY = 'ios_web_conversations_v1';
const PERSONAS_STORAGE_KEY = 'ios_web_personas_v1';
const PROFILES_STORAGE_KEY = 'ios_web_api_profiles_v2';
const ACTIVE_PROFILE_ID_KEY = 'ios_web_active_profile_id_v2';
const LEGACY_SETTINGS_STORAGE_KEY = 'ios_web_api_settings_v1';
const STATUS_BAR_STORAGE_KEY = 'ios_web_show_status_bar_v1';

// Safe localStorage wrapper that never throws in sandboxed iframes
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage read restricted', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage write restricted', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage remove restricted', e);
    }
  },
};

interface ChatContextType {
  activeApp: ActiveApp;
  chatSubView: ChatSubView;
  settingsSubView: SettingsSubView;
  personaSubView: PersonaSubView;
  selectedPersonaId: string | null;
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  personas: Persona[];
  apiProfiles: ApiProfile[];
  activeProfileId: string | null;
  activeProfile: ApiProfile | null;
  apiSettings: ApiSettings; // Kept for backwards compatibility
  isGenerating: boolean;
  currentError: string | null;
  openApp: (app: ActiveApp) => void;
  goHome: () => void;
  setChatSubView: (subView: ChatSubView) => void;
  setSettingsSubView: (subView: SettingsSubView) => void;
  setPersonaSubView: (subView: PersonaSubView) => void;
  setSelectedPersonaId: (id: string | null) => void;
  selectConversation: (id: string) => void;
  createNewConversation: () => string;
  createNewConversationWithPersona: (personaId?: string) => string;
  startChatWithPersona: (personaId: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  updateConversationRemark: (id: string, remark: string) => void;
  updateCharacterSettings: (conversationId: string, updates: Partial<CharacterChatSettings>) => void;
  clearConversationMessages: (conversationId: string) => void;
  editMessageContent: (conversationId: string, messageId: string, newContent: string) => void;
  deleteSingleMessage: (conversationId: string, messageId: string) => void;
  deleteMultipleMessages: (conversationId: string, messageIds: string[]) => void;
  postUserMessageOnly: (content: string, quote?: ChatQuote) => void;
  triggerAiReply: () => Promise<void>;
  sendMessage: (content: string, quote?: ChatQuote) => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  addPersona: (persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  addProfile: (profile: Omit<ApiProfile, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProfile: (id: string, updates: Partial<ApiProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfileCachedModels: (id: string, models: string[]) => void;
  importConversations: (imported: Conversation[]) => boolean;
  exportConversations: () => void;
  showStatusBar: boolean;
  setShowStatusBar: (show: boolean) => void;
  chatTab: ChatTab;
  setChatTab: (tab: ChatTab) => void;
  profileSubView: ProfileSubView;
  setProfileSubView: (view: ProfileSubView) => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  favorites: FavoriteMessage[];
  addFavorite: (item: Omit<FavoriteMessage, 'id'>) => void;
  removeFavorite: (messageId: string) => void;
  isMessageFavorited: (messageId: string) => boolean;
  chatTheme: ChatThemeSettings;
  updateChatTheme: (updates: Partial<ChatThemeSettings>) => void;
  updateContactDetails: (
    conversationId: string,
    updates: { name?: string; remark?: string; avatarUrl?: string; bio?: string }
  ) => void;
  createContactWithPersona: (
    name: string,
    description: string,
    remark?: string,
    avatarUrl?: string,
    bio?: string
  ) => string;
  importPersonaAsContact: (personaId: string) => string;
  moments: Moment[];
  momentsCoverUrl: string;
  setMomentsCoverUrl: (url: string) => void;
  publishMoment: (content: string, images?: string[]) => void;
  deleteMoment: (momentId: string) => void;
  toggleLikeMoment: (momentId: string) => void;
  addCommentToMoment: (
    momentId: string,
    content: string,
    replyToName?: string,
    replyToAuthorId?: string
  ) => void;
  deleteCommentFromMoment: (momentId: string, commentId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_STARTER_PERSONAS: Persona[] = [
  {
    id: 'persona_assistant',
    name: '温柔助理',
    description: '你是一位温柔、贴心且细致的个人生活助理。说话柔和亲切，富有同理心，总是以鼓励和支持的口吻回答问题。',
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'persona_mentor',
    name: '严谨导师',
    description: '你是一位知识渊博、逻辑严密、治学严谨的高校导师。条理清晰，善于深入浅出地剖析原理，解答问题直击要害。',
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
];

function getInitialConversations(): Conversation[] {
  try {
    const raw = safeStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse conversations from storage', e);
  }

  // Sensible default starter conversation
  const welcomeId = 'conv_welcome_' + Date.now();
  return [
    {
      id: welcomeId,
      title: '欢迎体验 iOS 助手',
      personaId: 'persona_assistant',
      createdAt: Date.now() - 1000 * 60 * 15,
      updatedAt: Date.now() - 1000 * 60 * 15,
      messages: [
        {
          id: 'msg_welcome_1',
          role: 'assistant',
          content:
            '您好！我是您的 iOS 风格智能助手。\n\n本应用所有功能真实可用：\n1. 支持自定义配置多个 API，支持智谱 AI、DeepSeek、OpenAI 等任意兼容接口；\n2. 可一键「获取模型列表」直接点选模型并自动缓存；\n3. 新增专属「人设库」，支持随时自由创建人设并绑定到对话中；\n4. 具备完整的上下文多轮记忆能力，所有数据均保存在本地。\n\n请前往「设置」配置 API 即可开启对话！',
          timestamp: Date.now() - 1000 * 60 * 15,
        },
      ],
    },
  ];
}

// Loads personas and migrates any existing conversation characterPrompt into personas
function getInitialPersonasAndMigrate(initialConvs: Conversation[]): {
  personas: Persona[];
  updatedConvs: Conversation[];
} {
  let loadedPersonas: Persona[] = [];
  try {
    const raw = safeStorage.getItem(PERSONAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedPersonas = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse personas from storage', e);
  }

  if (loadedPersonas.length === 0) {
    loadedPersonas = [...DEFAULT_STARTER_PERSONAS];
  }

  // Migration check: "5. 之前在各个聊天里已经写过的角色设定内容，请自动迁移：每段变成人设库里的一个人设（名称用该聊天的原名称），并绑定回原来的聊天，不要丢失"
  let didMigrate = false;
  const updatedConvs = initialConvs.map((conv) => {
    const legacyPrompt = conv.settings?.characterPrompt?.trim();
    if (legacyPrompt && !conv.personaId) {
      let matched = loadedPersonas.find((p) => p.description === legacyPrompt);
      if (!matched) {
        matched = {
          id: 'persona_migrated_' + conv.id,
          name: conv.remark?.trim() || conv.title || '自定义角色',
          description: legacyPrompt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        loadedPersonas.push(matched);
      }
      didMigrate = true;
      return {
        ...conv,
        personaId: matched.id,
      };
    }
    return conv;
  });

  if (didMigrate) {
    safeStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(loadedPersonas));
    safeStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updatedConvs));
  }

  return { personas: loadedPersonas, updatedConvs };
}

function getInitialProfiles(): { profiles: ApiProfile[]; activeId: string | null } {
  try {
    const raw = safeStorage.getItem(PROFILES_STORAGE_KEY);
    const savedActiveId = safeStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validActiveId = parsed.some((p: ApiProfile) => p.id === savedActiveId)
          ? savedActiveId
          : parsed[0].id;
        return { profiles: parsed, activeId: validActiveId };
      }
    }
  } catch (e) {
    console.error('Failed to parse profiles from storage', e);
  }

  // Check legacy settings
  try {
    const legacyRaw = safeStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy && (legacy.apiKey || legacy.baseURL)) {
        const migrated: ApiProfile = {
          id: 'profile_' + Date.now(),
          name: '默认配置',
          baseURL: legacy.baseURL || 'https://open.bigmodel.cn/api/paas/v4',
          apiKey: legacy.apiKey || '',
          model: legacy.model || 'glm-4-flash',
          temperature: legacy.temperature ?? 0.7,
          maxTokens: legacy.maxTokens,
          systemPrompt: legacy.systemPrompt || DEFAULT_API_SETTINGS.systemPrompt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return { profiles: [migrated], activeId: migrated.id };
      }
    }
  } catch (e) {
    console.error('Failed to parse legacy settings', e);
  }

  return { profiles: [INITIAL_DEFAULT_PROFILE], activeId: INITIAL_DEFAULT_PROFILE.id };
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeApp, setActiveApp] = useState<ActiveApp>('home');
  const [chatSubView, setChatSubView] = useState<ChatSubView>('list');
  const [chatTab, setChatTab] = useState<ChatTab>('messages');
  const [profileSubView, setProfileSubView] = useState<ProfileSubView>('main');

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const raw = safeStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (raw) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Failed to parse user profile', e);
    }
    return DEFAULT_USER_PROFILE;
  });

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      safeStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    try {
      const raw = safeStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse favorites', e);
    }
    return [];
  });

  const addFavorite = useCallback((item: Omit<FavoriteMessage, 'id'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.messageId === item.messageId)) return prev;
      const newFav: FavoriteMessage = {
        ...item,
        id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      const next = [newFav, ...prev];
      safeStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((messageId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.messageId !== messageId && f.id !== messageId);
      safeStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isMessageFavorited = useCallback(
    (messageId: string) => {
      return favorites.some((f) => f.messageId === messageId);
    },
    [favorites]
  );

  const [chatTheme, setChatTheme] = useState<ChatThemeSettings>(() => {
    try {
      const raw = safeStorage.getItem(CHAT_THEME_STORAGE_KEY);
      if (raw) return { ...DEFAULT_CHAT_THEME, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Failed to parse chat theme', e);
    }
    return DEFAULT_CHAT_THEME;
  });

  const updateChatTheme = useCallback((updates: Partial<ChatThemeSettings>) => {
    setChatTheme((prev) => {
      const next = { ...prev, ...updates };
      safeStorage.setItem(CHAT_THEME_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Moments state with persistence
  const [moments, setMoments] = useState<Moment[]>(() => {
    try {
      const raw = safeStorage.getItem(MOMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse moments', e);
    }
    return INITIAL_STARTER_MOMENTS;
  });

  const [momentsCoverUrl, setMomentsCoverUrlState] = useState<string>(() => {
    try {
      return safeStorage.getItem(MOMENTS_COVER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const setMomentsCoverUrl = useCallback((url: string) => {
    setMomentsCoverUrlState(url);
    safeStorage.setItem(MOMENTS_COVER_STORAGE_KEY, url);
  }, []);

  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>('main');
  const [personaSubView, setPersonaSubView] = useState<PersonaSubView>('list');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  // Initialize conversations and personas with automatic migration
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return getInitialConversations();
  });

  const [personas, setPersonas] = useState<Persona[]>(() => {
    const { personas: initialP, updatedConvs } = getInitialPersonasAndMigrate(conversations);
    if (updatedConvs !== conversations) {
      setTimeout(() => setConversations(updatedConvs), 0);
    }
    return initialP;
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return conversations[0]?.id || null;
  });

  const { profiles: initialProfiles, activeId: initialActiveId } = useMemo(
    () => getInitialProfiles(),
    []
  );
  const [apiProfiles, setApiProfiles] = useState<ApiProfile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(initialActiveId);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Status Bar visibility state (persisted)
  const [showStatusBar, setShowStatusBarState] = useState<boolean>(() => {
    try {
      const val = safeStorage.getItem(STATUS_BAR_STORAGE_KEY);
      if (val !== null) return val === 'true';
    } catch (e) {
      console.warn('Storage read restricted', e);
    }
    return true; // Default ON per requirement
  });

  const setShowStatusBar = useCallback((show: boolean) => {
    setShowStatusBarState(show);
    safeStorage.setItem(STATUS_BAR_STORAGE_KEY, String(show));
  }, []);

  // Sync conversations to storage
  useEffect(() => {
    safeStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Sync personas to storage
  useEffect(() => {
    safeStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas));
  }, [personas]);

  // Sync profiles to storage
  useEffect(() => {
    safeStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(apiProfiles));
  }, [apiProfiles]);

  // Sync active profile ID to storage
  useEffect(() => {
    if (activeProfileId) {
      safeStorage.setItem(ACTIVE_PROFILE_ID_KEY, activeProfileId);
    }
  }, [activeProfileId]);

  const currentConversation = useMemo(() => {
    return (conversations || []).find((c) => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const activeProfile = useMemo(() => {
    return (apiProfiles || []).find((p) => p.id === activeProfileId) || apiProfiles[0] || null;
  }, [apiProfiles, activeProfileId]);

  // Compatibility object for apiSettings
  const apiSettings: ApiSettings = useMemo(() => {
    if (activeProfile) {
      return {
        baseURL: activeProfile.baseURL,
        apiKey: activeProfile.apiKey,
        model: activeProfile.model,
        temperature: activeProfile.temperature ?? 0.7,
        maxTokens: activeProfile.maxTokens,
        systemPrompt: activeProfile.systemPrompt ?? DEFAULT_API_SETTINGS.systemPrompt,
      };
    }
    return DEFAULT_API_SETTINGS;
  }, [activeProfile]);

  const openApp = useCallback((app: ActiveApp) => {
    setActiveApp(app);
    if (app === 'settings') {
      setSettingsSubView('main');
    } else if (app === 'personas') {
      setPersonaSubView('list');
      setSelectedPersonaId(null);
    }
  }, []);

  const goHome = useCallback(() => {
    setActiveApp('home');
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setChatSubView('room');
  }, []);

  const createNewConversation = useCallback(() => {
    const newId = 'conv_' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      settings: { ...DEFAULT_CHARACTER_SETTINGS },
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newId);
    setChatSubView('room');
    return newId;
  }, []);

  const createNewConversationWithPersona = useCallback(
    (personaId?: string) => {
      const targetP = personaId ? personas.find((p) => p.id === personaId) : undefined;
      const newId = 'conv_' + Date.now();
      const newConv: Conversation = {
        id: newId,
        title: targetP ? targetP.name : '新对话',
        personaId: personaId || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        settings: { ...DEFAULT_CHARACTER_SETTINGS },
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newId);
      setChatSubView('room');
      return newId;
    },
    [personas]
  );

  const startChatWithPersona = useCallback(
    (personaId: string) => {
      const targetP = personas.find((p) => p.id === personaId);
      const newId = 'conv_' + Date.now();
      const newConv: Conversation = {
        id: newId,
        title: targetP ? targetP.name : '新对话',
        personaId: personaId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        settings: { ...DEFAULT_CHARACTER_SETTINGS },
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newId);
      setActiveApp('chat');
      setChatSubView('room');
    },
    [personas]
  );

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setCurrentConversationId((prevId) => {
      if (prevId === id) {
        setChatSubView('list');
        return null;
      }
      return prevId;
    });
  }, []);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    setChatSubView('list');
  }, []);

  const updateConversationRemark = useCallback((id: string, remark: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              remark: remark.trim() || undefined,
              updatedAt: Date.now(),
            }
          : c
      )
    );
  }, []);

  const updateContactDetails = useCallback(
    (
      conversationId: string,
      updates: { name?: string; remark?: string; avatarUrl?: string; bio?: string }
    ) => {
      let targetPersonaId: string | undefined;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            targetPersonaId = c.personaId;
            return {
              ...c,
              title: updates.name !== undefined ? updates.name : c.title,
              remark: updates.remark !== undefined ? updates.remark : c.remark,
              avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : c.avatarUrl,
              bio: updates.bio !== undefined ? updates.bio : c.bio,
              updatedAt: Date.now(),
              settings: {
                ...c.settings,
                avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : c.settings?.avatarUrl,
                bio: updates.bio !== undefined ? updates.bio : c.settings?.bio,
              },
            };
          }
          return c;
        })
      );

      // If linked to a persona, keep persona name and bio synchronized!
      if (targetPersonaId) {
        setPersonas((prev) =>
          prev.map((p) => {
            if (p.id === targetPersonaId) {
              return {
                ...p,
                name: updates.name !== undefined ? updates.name : p.name,
                avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : p.avatarUrl,
                bio: updates.bio !== undefined ? updates.bio : p.bio,
                updatedAt: Date.now(),
              };
            }
            return p;
          })
        );
      }
    },
    []
  );

  const createContactWithPersona = useCallback(
    (
      name: string,
      description: string,
      remark?: string,
      avatarUrl?: string,
      bio?: string
    ) => {
      const pId = 'persona_' + Date.now();
      const newPersona: Persona = {
        id: pId,
        name: name.trim() || '新角色',
        description: description.trim(),
        avatarUrl,
        bio,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPersonas((prev) => [newPersona, ...prev]);

      const convId = 'conv_' + Date.now();
      const newConv: Conversation = {
        id: convId,
        title: name.trim() || '新角色',
        remark: remark?.trim() || undefined,
        personaId: pId,
        avatarUrl,
        bio,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        settings: { ...DEFAULT_CHARACTER_SETTINGS, avatarUrl, bio },
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(convId);
      return convId;
    },
    []
  );

  const importPersonaAsContact = useCallback(
    (personaId: string) => {
      const existingConv = conversations.find((c) => c.personaId === personaId);
      if (existingConv) {
        setCurrentConversationId(existingConv.id);
        return existingConv.id;
      }

      const targetP = personas.find((p) => p.id === personaId);
      const newId = 'conv_' + Date.now();
      const newConv: Conversation = {
        id: newId,
        title: targetP ? targetP.name : '新对话',
        personaId: personaId,
        avatarUrl: targetP?.avatarUrl,
        bio: targetP?.bio || targetP?.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        settings: { ...DEFAULT_CHARACTER_SETTINGS, avatarUrl: targetP?.avatarUrl },
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newId);
      return newId;
    },
    [conversations, personas]
  );

  const updateCharacterSettings = useCallback(
    (conversationId: string, updates: Partial<CharacterChatSettings>) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                settings: {
                  ...(c.settings || DEFAULT_CHARACTER_SETTINGS),
                  ...updates,
                },
              }
            : c
        )
      );
    },
    []
  );

  const clearConversationMessages = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [],
            }
          : c
      )
    );
  }, []);

  const editMessageContent = useCallback(
    (conversationId: string, messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content: trimmed } : m
                ),
              }
            : c
        )
      );
    },
    []
  );

  const deleteSingleMessage = useCallback(
    (conversationId: string, messageId: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.filter((m) => m.id !== messageId),
              }
            : c
        )
      );
    },
    []
  );

  const deleteMultipleMessages = useCallback(
    (conversationId: string, messageIds: string[]) => {
      const idSet = new Set(messageIds);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.filter((m) => !idSet.has(m.id)),
              }
            : c
        )
      );
    },
    []
  );

  // Persona Management
  const addPersona = useCallback(
    (persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const newId = 'persona_' + Date.now();
      const newP: Persona = {
        ...persona,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPersonas((prev) => [newP, ...prev]);
      return newId;
    },
    []
  );

  const updatePersona = useCallback((id: string, updates: Partial<Persona>) => {
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const deletePersona = useCallback(
    (id: string) => {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      // Requirement: "5. 删除人设后：已经用它聊过的对话保留聊天记录，之后不再带这个人设"
      setConversations((prev) =>
        prev.map((c) => (c.personaId === id ? { ...c, personaId: undefined } : c))
      );
      if (selectedPersonaId === id) {
        setSelectedPersonaId(null);
        setPersonaSubView('list');
      }
    },
    [selectedPersonaId]
  );

  // Profile Management
  const addProfile = useCallback(
    (profile: Omit<ApiProfile, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const newId = 'profile_' + Date.now();
      const newProfile: ApiProfile = {
        ...profile,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setApiProfiles((prev) => [...prev, newProfile]);
      setActiveProfileId(newId);
      return newId;
    },
    []
  );

  const updateProfile = useCallback((id: string, updates: Partial<ApiProfile>) => {
    setApiProfiles((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const deleteProfile = useCallback(
    (id: string) => {
      setApiProfiles((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        if (activeProfileId === id) {
          const nextActive = filtered[0]?.id || null;
          setActiveProfileId(nextActive);
        }
        return filtered;
      });
    },
    [activeProfileId]
  );

  const setActiveProfile = useCallback((id: string) => {
    setActiveProfileId(id);
  }, []);

  const updateProfileCachedModels = useCallback((id: string, models: string[]) => {
    setApiProfiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              cachedModels: models,
              updatedAt: Date.now(),
            }
          : p
      )
    );
  }, []);

  const importConversations = useCallback((imported: Conversation[]) => {
    if (!Array.isArray(imported)) return false;
    setConversations(imported);
    if (imported.length > 0) {
      setCurrentConversationId(imported[0].id);
    }
    return true;
  }, []);

  const exportConversations = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ios_conversations_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [conversations]);

  // AI Generation with Persona Binding
  const runAiGeneration = useCallback(
    async (convId: string, messagesToSend: ChatMessage[]) => {
      if (!activeProfile) {
        setCurrentError('请先在「设置」中配置 API Key。');
        return;
      }

      if (!activeProfile.apiKey?.trim()) {
        const failedMsg: ChatMessage = {
          id: 'msg_fail_' + Date.now(),
          role: 'assistant',
          content: '',
          error: '请先到设置中添加 API Key 后再发送消息。',
          failed: true,
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, failedMsg],
                }
              : c
          )
        );
        return;
      }

      setIsGenerating(true);
      setCurrentError(null);

      const targetConv = (conversations || []).find((c) => c.id === convId);
      const settings = targetConv?.settings || DEFAULT_CHARACTER_SETTINGS;

      // Dynamically resolve persona content from Personas Library
      const boundPersona = targetConv?.personaId
        ? personas.find((p) => p.id === targetConv.personaId)
        : undefined;
      const personaDescription = boundPersona?.description || settings.characterPrompt || '';

      // Compose prompt: "人设内容 + 多条回复规则", without reply length or speech style
      const systemPrompt = composeSystemPrompt(
        personaDescription,
        settings.allowMultipleBubbles,
        activeProfile.systemPrompt || DEFAULT_API_SETTINGS.systemPrompt
      );

      // Prepare messages for API: if a user message has a quote, prefix with quote context
      const formattedForApi: ChatMessage[] = messagesToSend.map((m) => {
        if (m.quote && m.role === 'user') {
          return {
            ...m,
            content: `[回复引用: "${m.quote.content}"]\n${m.content}`,
          };
        }
        return m;
      });

      try {
        const result = await sendChatCompletion(
          activeProfile,
          formattedForApi,
          systemPrompt
        );

        if (settings.allowMultipleBubbles) {
          // Split by ||| delimiter
          const rawParts = result.content
            .split('|||')
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          const parts = rawParts.length > 0 ? rawParts : [result.content.trim()];

          // Render first bubble immediately
          const firstMsg: ChatMessage = {
            id: 'msg_ai_' + Date.now() + '_0',
            role: 'assistant',
            content: parts[0],
            timestamp: Date.now(),
          };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: [...c.messages, firstMsg],
                  }
                : c
            )
          );

          // Render subsequent bubbles with 0.5s - 1.5s delay
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const delayMs = Math.min(1500, Math.max(500, part.length * 35));
            await new Promise((resolve) => setTimeout(resolve, delayMs));

            const nextMsg: ChatMessage = {
              id: 'msg_ai_' + Date.now() + '_' + i,
              role: 'assistant',
              content: part,
              timestamp: Date.now(),
            };

            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      updatedAt: Date.now(),
                      messages: [...c.messages, nextMsg],
                    }
                  : c
              )
            );
          }
        } else {
          // Single bubble: clean any accidental ||| delimiter
          const cleanContent = result.content.replace(/\|\|\|/g, '\n\n').trim();
          const aiMsg: ChatMessage = {
            id: 'msg_ai_' + Date.now(),
            role: 'assistant',
            content: cleanContent,
            timestamp: Date.now(),
          };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: [...c.messages, aiMsg],
                  }
                : c
            )
          );
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : '发生了未知错误，请重试。';
        setCurrentError(errorMessage);

        const failedMsg: ChatMessage = {
          id: 'msg_fail_' + Date.now(),
          role: 'assistant',
          content: '',
          error: errorMessage,
          failed: true,
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, failedMsg],
                }
              : c
          )
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [activeProfile, conversations, personas]
  );

  const postUserMessageOnly = useCallback(
    (content: string, quote?: ChatQuote) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      let convId = currentConversationId;
      let targetConv = (conversations || []).find((c) => c.id === convId);

      if (!targetConv || !convId) {
        convId = 'conv_' + Date.now();
        targetConv = {
          id: convId,
          title: trimmed.slice(0, 14),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          settings: { ...DEFAULT_CHARACTER_SETTINGS },
        };
        setConversations((prev) => [targetConv!, ...prev]);
        setCurrentConversationId(convId);
      }

      const userMsg: ChatMessage = {
        id: 'msg_user_' + Date.now(),
        role: 'user',
        content: trimmed,
        quote: quote ? { ...quote } : undefined,
        timestamp: Date.now(),
      };

      const shouldUpdateTitle =
        targetConv.messages.length === 0 || targetConv.title === '新对话';
      const updatedTitle = shouldUpdateTitle ? trimmed.slice(0, 14) : targetConv.title;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: updatedTitle,
                updatedAt: Date.now(),
                messages: [...c.messages, userMsg],
              }
            : c
        )
      );
    },
    [currentConversationId, conversations]
  );

  const triggerAiReply = useCallback(async () => {
    if (!currentConversationId || isGenerating) return;
    const targetConv = (conversations || []).find((c) => c.id === currentConversationId);
    if (!targetConv || targetConv.messages.length === 0) return;

    await runAiGeneration(currentConversationId, targetConv.messages);
  }, [currentConversationId, isGenerating, conversations, runAiGeneration]);

  const sendMessage = useCallback(
    async (content: string, quote?: ChatQuote) => {
      const trimmed = content.trim();
      if (!trimmed || isGenerating) return;

      let convId = currentConversationId;
      let targetConv = (conversations || []).find((c) => c.id === convId);

      if (!targetConv || !convId) {
        convId = 'conv_' + Date.now();
        targetConv = {
          id: convId,
          title: trimmed.slice(0, 14),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          settings: { ...DEFAULT_CHARACTER_SETTINGS },
        };
        setConversations((prev) => [targetConv!, ...prev]);
        setCurrentConversationId(convId);
      }

      const userMsg: ChatMessage = {
        id: 'msg_user_' + Date.now(),
        role: 'user',
        content: trimmed,
        quote: quote ? { ...quote } : undefined,
        timestamp: Date.now(),
      };

      const shouldUpdateTitle =
        targetConv.messages.length === 0 || targetConv.title === '新对话';
      const updatedTitle = shouldUpdateTitle ? trimmed.slice(0, 14) : targetConv.title;
      const updatedMessagesWithUser = [...targetConv.messages, userMsg];

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: updatedTitle,
                updatedAt: Date.now(),
                messages: updatedMessagesWithUser,
              }
            : c
        )
      );

      // Check if autoReplyOnSend is enabled (default true)
      const shouldAutoReply = targetConv.settings?.autoReplyOnSend !== false;
      if (shouldAutoReply) {
        await runAiGeneration(convId, updatedMessagesWithUser);
      }
    },
    [currentConversationId, isGenerating, conversations, runAiGeneration]
  );

  const retryFailedMessage = useCallback(
    async (messageId: string) => {
      if (!currentConversationId || isGenerating || !activeProfile) return;

      const targetConv = (conversations || []).find((c) => c.id === currentConversationId);
      if (!targetConv) return;

      const failIdx = targetConv.messages.findIndex((m) => m.id === messageId);
      if (failIdx === -1) return;

      const validMessages = targetConv.messages.slice(0, failIdx);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversationId
            ? {
                ...c,
                messages: c.messages.filter((m) => m.id !== messageId),
              }
            : c
        )
      );

      await runAiGeneration(currentConversationId, validMessages);
    },
    [currentConversationId, isGenerating, activeProfile, conversations, runAiGeneration]
  );

  const publishMoment = useCallback(
    (content: string, images: string[] = []) => {
      const trimmed = content.trim();
      if (!trimmed && images.length === 0) return;

      const newMoment: Moment = {
        id: 'moment_' + Date.now(),
        authorId: 'user',
        authorName: userProfile.nickname || '我',
        authorAvatar: userProfile.avatarUrl || '',
        isUser: true,
        content: trimmed,
        images,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      };

      setMoments((prev) => {
        const next = [newMoment, ...prev];
        safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      // Role interaction (AI):
      const eligibleContacts = conversations.filter(
        (c) => c.settings?.autoInteractMoments === true
      );

      eligibleContacts.forEach((contact) => {
        const willLike = Math.random() < 0.6;
        const willComment = Math.random() < 0.4;
        if (!willLike && !willComment) return;

        const displayName = contact.remark?.trim() || contact.title || '角色';
        const personaDesc =
          personas.find((p) => p.id === contact.personaId)?.description ||
          contact.settings?.characterPrompt ||
          '好友';

        // 1. Like with delay between 10s and 90s
        if (willLike) {
          const likeDelay = Math.floor(10000 + Math.random() * 80000);
          setTimeout(() => {
            setMoments((prev) => {
              const target = prev.find((m) => m.id === newMoment.id);
              if (!target) return prev;
              if (target.likes.some((l) => l.authorId === contact.id)) return prev;
              const updatedLikes = [
                ...target.likes,
                { authorId: contact.id, authorName: displayName },
              ];
              const next = prev.map((m) =>
                m.id === newMoment.id ? { ...m, likes: updatedLikes } : m
              );
              safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }, likeDelay);
        }

        // 2. Comment with delay between 15s and 120s
        if (willComment) {
          const commentDelay = Math.floor(15000 + Math.random() * 105000);
          setTimeout(async () => {
            if (!activeProfile || !activeProfile.apiKey?.trim()) return;

            try {
              const systemPrompt = `你是${displayName}。你的专属人设背景：${personaDesc}。请以你的角色性格与口吻对我的最新动态写一句简短精悍的评论。要求：字数在30字以内，语气真实生动，严禁出现任何AI身份自称（如'作为AI'、'我是助手'等）。`;
              const userPrompt = `我的最新动态：\n“${trimmed}”${
                images.length > 0 ? `\n（动态附有 ${images.length} 张图片）` : ''
              }`;

              const res = await sendChatCompletion(
                activeProfile,
                [
                  { id: 'sys_' + Date.now(), role: 'system', content: systemPrompt, timestamp: Date.now() },
                  { id: 'usr_' + Date.now(), role: 'user', content: userPrompt, timestamp: Date.now() },
                ],
                300
              );
              const aiComment = res.content;

              if (aiComment && aiComment.trim()) {
                const cleaned = aiComment.trim().replace(/^["“]|["”]$/g, '').slice(0, 45);
                setMoments((prev) => {
                  const target = prev.find((m) => m.id === newMoment.id);
                  if (!target) return prev;
                  const newC: MomentComment = {
                    id: 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    authorId: contact.id,
                    authorName: displayName,
                    content: cleaned,
                    createdAt: Date.now(),
                  };
                  const next = prev.map((m) =>
                    m.id === newMoment.id
                      ? { ...m, comments: [...m.comments, newC] }
                      : m
                  );
                  safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
                  return next;
                });
              }
            } catch (err) {
              console.warn('AI moment comment skipped', err);
            }
          }, commentDelay);
        }
      });
    },
    [userProfile, conversations, personas, activeProfile]
  );

  const toggleLikeMoment = useCallback(
    (momentId: string) => {
      const myName = userProfile.nickname || '我';
      setMoments((prev) => {
        const next = prev.map((m) => {
          if (m.id !== momentId) return m;
          const hasLiked = m.likes.some((l) => l.authorId === 'user');
          const newLikes = hasLiked
            ? m.likes.filter((l) => l.authorId !== 'user')
            : [...m.likes, { authorId: 'user', authorName: myName }];
          return { ...m, likes: newLikes };
        });
        safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [userProfile]
  );

  const addCommentToMoment = useCallback(
    (
      momentId: string,
      commentText: string,
      replyToName?: string,
      replyToAuthorId?: string
    ) => {
      const trimmed = commentText.trim();
      if (!trimmed) return;

      const myName = userProfile.nickname || '我';
      const newComment: MomentComment = {
        id: 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        authorId: 'user',
        authorName: myName,
        replyToName: replyToName || undefined,
        content: trimmed,
        createdAt: Date.now(),
      };

      setMoments((prev) => {
        const next = prev.map((m) =>
          m.id === momentId ? { ...m, comments: [...m.comments, newComment] } : m
        );
        safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      // If user replied to a contact comment, check if that contact has autoInteractMoments enabled:
      if (replyToAuthorId && replyToAuthorId !== 'user') {
        const targetContact = conversations.find((c) => c.id === replyToAuthorId);
        if (targetContact && targetContact.settings?.autoInteractMoments === true) {
          const displayName = targetContact.remark?.trim() || targetContact.title || '角色';
          const personaDesc =
            personas.find((p) => p.id === targetContact.personaId)?.description ||
            targetContact.settings?.characterPrompt ||
            '好友';

          const replyDelay = Math.floor(8000 + Math.random() * 12000);
          setTimeout(async () => {
            if (!activeProfile || !activeProfile.apiKey?.trim()) return;

            try {
              const systemPrompt = `你是${displayName}。你的专属人设背景：${personaDesc}。用户在动态下回复了你的评论：“${trimmed}”。请以你的角色口吻写一句简短回应（30字以内，严禁出现AI自称）。`;
              const res = await sendChatCompletion(
                activeProfile,
                [
                  { id: 'sys_' + Date.now(), role: 'system', content: systemPrompt, timestamp: Date.now() },
                  { id: 'usr_' + Date.now(), role: 'user', content: `用户回复了你：“${trimmed}”，请回复。`, timestamp: Date.now() },
                ],
                250
              );
              const aiReply = res.content;

              if (aiReply && aiReply.trim()) {
                const cleaned = aiReply.trim().replace(/^["“]|["”]$/g, '').slice(0, 45);
                setMoments((prev) => {
                  const target = prev.find((m) => m.id === momentId);
                  if (!target) return prev;
                  const newC: MomentComment = {
                    id: 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    authorId: targetContact.id,
                    authorName: displayName,
                    replyToName: myName,
                    content: cleaned,
                    createdAt: Date.now(),
                  };
                  const next = prev.map((m) =>
                    m.id === momentId
                      ? { ...m, comments: [...m.comments, newC] }
                      : m
                  );
                  safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
                  return next;
                });
              }
            } catch (err) {
              console.warn('AI comment reply skipped', err);
            }
          }, replyDelay);
        }
      }
    },
    [userProfile, conversations, personas, activeProfile]
  );

  const deleteMoment = useCallback((momentId: string) => {
    setMoments((prev) => {
      const next = prev.filter((m) => m.id !== momentId);
      safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteCommentFromMoment = useCallback((momentId: string, commentId: string) => {
    setMoments((prev) => {
      const next = prev.map((m) => {
        if (m.id !== momentId) return m;
        return {
          ...m,
          comments: m.comments.filter((c) => c.id !== commentId),
        };
      });
      safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Periodic background check for contacts with autoPostMoments enabled
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!activeProfile || !activeProfile.apiKey?.trim()) return;

      const now = Date.now();
      for (const conv of conversations) {
        if (conv.settings?.autoPostMoments === true) {
          const intervalMinutes = Math.max(1, Math.min(1000, conv.settings.autoPostIntervalMinutes || 60));
          const intervalMs = intervalMinutes * 60 * 1000;
          const lastPost = conv.settings.lastAutoPostTime || 0;

          if (now - lastPost >= intervalMs) {
            updateCharacterSettings(conv.id, { lastAutoPostTime: now });

            const displayName = conv.remark?.trim() || conv.title || '角色';
            const personaDesc =
              personas.find((p) => p.id === conv.personaId)?.description ||
              conv.settings?.characterPrompt ||
              '好友伙伴';

            try {
              const systemPrompt = `你是${displayName}。你的专属人设背景：${personaDesc}。请以你的角色第一人称发布一条社交动态朋友圈（内容可以是心情感悟、生活随笔、思考或趣事）。要求：字数在15~60字之间，语气符合人设，自然生动，严禁出现任何AI身份自称。`;
              const res = await sendChatCompletion(
                activeProfile,
                [
                  { id: 'sys_' + Date.now(), role: 'system', content: systemPrompt, timestamp: Date.now() },
                  { id: 'usr_' + Date.now(), role: 'user', content: '请发布一条符合你人设的最新动态。', timestamp: Date.now() },
                ],
                300
              );
              const aiPost = res.content;

              if (aiPost && aiPost.trim()) {
                const cleaned = aiPost.trim().replace(/^["“]|["”]$/g, '');
                const autoMoment: Moment = {
                  id: 'moment_' + Date.now(),
                  authorId: conv.id,
                  authorName: displayName,
                  authorAvatar: conv.avatarUrl || conv.settings?.avatarUrl,
                  isUser: false,
                  content: cleaned,
                  images: [],
                  likes: [],
                  comments: [],
                  createdAt: Date.now(),
                };

                setMoments((prev) => {
                  const next = [autoMoment, ...prev];
                  safeStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(next));
                  return next;
                });
              }
            } catch (err) {
              console.warn('Auto post moment skipped', err);
            }
          }
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [conversations, personas, activeProfile, updateCharacterSettings]);

  return (
    <ChatContext.Provider
      value={{
        activeApp,
        chatSubView,
        settingsSubView,
        personaSubView,
        selectedPersonaId,
        conversations,
        currentConversationId,
        currentConversation,
        personas,
        apiProfiles,
        activeProfileId,
        activeProfile,
        apiSettings,
        isGenerating,
        currentError,
        openApp,
        goHome,
        setChatSubView,
        setSettingsSubView,
        setPersonaSubView,
        setSelectedPersonaId,
        selectConversation,
        createNewConversation,
        createNewConversationWithPersona,
        startChatWithPersona,
        deleteConversation,
        clearAllConversations,
        updateConversationRemark,
        updateCharacterSettings,
        clearConversationMessages,
        editMessageContent,
        deleteSingleMessage,
        deleteMultipleMessages,
        postUserMessageOnly,
        triggerAiReply,
        sendMessage,
        retryFailedMessage,
        addPersona,
        updatePersona,
        deletePersona,
        addProfile,
        updateProfile,
        deleteProfile,
        setActiveProfile,
        updateProfileCachedModels,
        importConversations,
        exportConversations,
        showStatusBar,
        setShowStatusBar,
        chatTab,
        setChatTab,
        profileSubView,
        setProfileSubView,
        userProfile,
        updateUserProfile,
        favorites,
        addFavorite,
        removeFavorite,
        isMessageFavorited,
        chatTheme,
        updateChatTheme,
        updateContactDetails,
        createContactWithPersona,
        importPersonaAsContact,
        moments,
        momentsCoverUrl,
        setMomentsCoverUrl,
        publishMoment,
        deleteMoment,
        toggleLikeMoment,
        addCommentToMoment,
        deleteCommentFromMoment,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
