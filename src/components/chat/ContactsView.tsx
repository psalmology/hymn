import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Search,
  UserPlus,
  ChevronRight,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Conversation } from '../../types';
import { getInitialLetter } from '../../utils/pinyin';
import { ContactProfileView } from './ContactProfileView';
import { AddContactModal } from './AddContactModal';

const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

type SortMode = 'name' | 'recent' | 'created';

export const ContactsView: React.FC = () => {
  const { conversations, selectConversation, setChatSubView, goHome } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // If viewing a contact's profile details
  if (selectedContactId) {
    return (
      <ContactProfileView
        contactId={selectedContactId}
        onBack={() => setSelectedContactId(null)}
      />
    );
  }

  // Filter contacts by search query (name or remark)
  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => {
      const name = (c.title || '').toLowerCase();
      const remark = (c.remark || '').toLowerCase();
      return name.includes(query) || remark.includes(query);
    });
  }, [conversations, searchQuery]);

  // Group contacts by initial letter when sorted by name A-Z
  const groupedContacts = useMemo(() => {
    if (sortMode !== 'name') return null;

    const groups: Record<string, Conversation[]> = {};
    ALPHABET.forEach((letter) => {
      groups[letter] = [];
    });

    // Sort contacts by display name
    const sorted = [...filteredContacts].sort((a, b) => {
      const nameA = a.remark?.trim() || a.title || '';
      const nameB = b.remark?.trim() || b.title || '';
      return nameA.localeCompare(nameB, 'zh-Hans-CN');
    });

    sorted.forEach((contact) => {
      const displayName = contact.remark?.trim() || contact.title || '';
      const letter = getInitialLetter(displayName);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    });

    return groups;
  }, [filteredContacts, sortMode]);

  // Sorted list for non-alphabetical modes
  const flatSortedContacts = useMemo(() => {
    if (sortMode === 'name') return [];
    return [...filteredContacts].sort((a, b) => {
      if (sortMode === 'recent') {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      }
      if (sortMode === 'created') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return 0;
    });
  }, [filteredContacts, sortMode]);

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`group-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSortLabel = () => {
    if (sortMode === 'name') return '按名称 A-Z';
    if (sortMode === 'recent') return '按最近聊天';
    if (sortMode === 'created') return '按添加时间';
    return '排序方式';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none relative">
      {/* Top Header */}
      <div className="pt-12 pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-8 mb-1">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity -ml-1.5 cursor-pointer"
            title="返回桌面 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-1 text-neutral-700" />
            <span>返回</span>
          </button>
        </div>

        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          Contacts
        </h1>

        {/* Search Bar */}
        <div className="mt-2.5 relative flex items-center">
          <Search
            size={15}
            className="absolute left-3 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索名称或备注..."
            className="w-full h-9 pl-9 pr-8 text-[14px] bg-[#E3E3E8] rounded-xl text-neutral-900 placeholder:text-neutral-500 outline-none focus:bg-[#EAEAEF] focus:ring-1 focus:ring-black/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-3.5 relative">
        {/* "添加好友" Card */}
        <div
          onClick={() => setShowAddModal(true)}
          className="bg-white rounded-2xl p-3.5 border border-black/[0.06] shadow-xs flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 shadow-3xs group-hover:bg-neutral-200 transition-colors">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900 leading-snug">
                添加好友
              </h3>
              <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                导入角色或新建角色
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        </div>

        {/* Contacts Count & Sort Selector Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[12px] font-medium text-neutral-500">
            {filteredContacts.length} Contacts
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortDropdown((prev) => !prev)}
              className="flex items-center gap-1 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 bg-white/80 px-2.5 py-1 rounded-full border border-black/[0.06] shadow-3xs cursor-pointer active:scale-95 transition-all"
            >
              <ArrowUpDown size={12} className="text-neutral-400" />
              <span>{getSortLabel()}</span>
            </button>

            {/* Sort Mode Dropdown */}
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-7 z-40 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-xl p-1 min-w-[130px] divide-y divide-black/[0.05] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode('name');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-[12px] font-medium text-left rounded-xl transition-colors cursor-pointer ${
                      sortMode === 'name' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    按名称 A-Z
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode('recent');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-[12px] font-medium text-left rounded-xl transition-colors cursor-pointer ${
                      sortMode === 'recent' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    按最近聊天
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode('created');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-[12px] font-medium text-left rounded-xl transition-colors cursor-pointer ${
                      sortMode === 'created' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    按添加时间
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contacts List Body */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-black/[0.06] shadow-xs">
            <p className="text-[14px] text-neutral-600 font-medium">
              {searchQuery ? '没有找到匹配的联系人' : '暂无联系人'}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1">
              {searchQuery ? '换个名称或备注试一试' : '点击上方「添加好友」即可导入或新建角色'}
            </p>
          </div>
        ) : sortMode === 'name' && groupedContacts ? (
          /* Alphabetical Grouping Mode */
          <div className="space-y-4">
            {ALPHABET.map((letter) => {
              const list = groupedContacts[letter] || [];
              if (list.length === 0) return null;

              return (
                <div key={letter} id={`group-${letter}`} className="space-y-1.5 scroll-mt-28">
                  {/* Group Letter Header */}
                  <h4 className="text-[12px] font-bold text-neutral-400 px-2 tracking-wide">
                    {letter}
                  </h4>

                  {/* Group Cards Container */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden divide-y divide-black/[0.05]">
                    {list.map((contact) => {
                      const avatar = contact.avatarUrl || contact.settings?.avatarUrl;
                      const name = contact.title || '联系人';
                      const remark = contact.remark?.trim();
                      const firstLetter = (remark || name).slice(0, 1);

                      return (
                        <div
                          key={contact.id}
                          onClick={() => setSelectedContactId(contact.id)}
                          className="p-3 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-black/5 bg-[#D4D5DC] flex items-center justify-center shrink-0 shadow-2xs font-semibold text-[14px] text-neutral-700">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={remark || name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                firstLetter
                              )}
                            </div>

                            {/* Name & Remark */}
                            <div className="min-w-0">
                              <h5 className="text-[15px] font-semibold text-neutral-900 truncate leading-snug">
                                {remark || name}
                              </h5>
                              {remark && (
                                <p className="text-[11px] text-neutral-400 truncate leading-snug">
                                  {name}
                                </p>
                              )}
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Mode (Recent or Created) */
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden divide-y divide-black/[0.05]">
            {flatSortedContacts.map((contact) => {
              const avatar = contact.avatarUrl || contact.settings?.avatarUrl;
              const name = contact.title || '联系人';
              const remark = contact.remark?.trim();
              const firstLetter = (remark || name).slice(0, 1);

              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className="p-3 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-black/5 bg-[#D4D5DC] flex items-center justify-center shrink-0 shadow-2xs font-semibold text-[14px] text-neutral-700">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={remark || name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        firstLetter
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[15px] font-semibold text-neutral-900 truncate leading-snug">
                        {remark || name}
                      </h5>
                      {remark && (
                        <p className="text-[11px] text-neutral-400 truncate leading-snug">
                          {name}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* A-Z Vertical Index Bar (Shown when in Name sort mode) */}
      {sortMode === 'name' && (
        <div className="absolute right-1 top-36 bottom-6 flex flex-col justify-center items-center z-20 pointer-events-auto py-1">
          {ALPHABET.map((letter) => {
            const hasItems = Boolean(groupedContacts && groupedContacts[letter]?.length > 0);
            return (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                className={`text-[9px] font-semibold px-1 py-0.5 leading-none transition-colors cursor-pointer select-none ${
                  hasItems
                    ? 'text-neutral-800 font-bold hover:text-black'
                    : 'text-neutral-300 hover:text-neutral-400'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onOpenChat={(convId) => {
            setShowAddModal(false);
            selectConversation(convId);
            setChatSubView('room');
          }}
        />
      )}
    </div>
  );
};
