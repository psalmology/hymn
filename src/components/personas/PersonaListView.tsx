import React, { useState, useMemo } from 'react';
import { Plus, Search, ChevronRight, ChevronLeft, BookUser } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const PersonaListView: React.FC = () => {
  const {
    personas,
    goHome,
    setPersonaSubView,
    setSelectedPersonaId,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredPersonas = useMemo(() => {
    const list = personas || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [personas, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Top Header */}
      <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="flex items-center justify-between h-9 mb-1">
          <button
            type="button"
            onClick={goHome}
            className="ios-back-btn text-[15px] font-normal text-neutral-800 hover:text-black active:opacity-60 transition-opacity pr-2 cursor-pointer"
            title="返回桌面 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-700" />
            <span>返回</span>
          </button>

          <button
            type="button"
            onClick={() => setPersonaSubView('create')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-900 cursor-pointer"
            title="新建人设"
          >
            <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs">
              <Plus size={17} strokeWidth={2.5} />
            </span>
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            人设库
          </h1>
          <span className="text-[12px] text-neutral-400 font-normal">
            {filteredPersonas.length} 个人设
          </span>
        </div>

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
            placeholder="搜索人设名称或设定内容..."
            className="w-full h-9 pl-9 pr-8 text-[14px] bg-[#E3E3E8] rounded-xl text-neutral-900 placeholder:text-neutral-500 outline-none focus:bg-[#EAEAEF] focus:ring-1 focus:ring-black/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-300 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Personas List */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/[0.06]">
        {filteredPersonas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-500 mb-3">
              <BookUser size={28} />
            </div>
            <p className="text-[15px] font-medium text-neutral-600">
              {searchQuery ? '没有找到相关人设' : '人设库为空'}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1 max-w-[200px]">
              {searchQuery
                ? '换个关键词试一试'
                : '点击右上角「+」创建专属角色设定'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setPersonaSubView('create')}
                className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform cursor-pointer"
              >
                新建人设
              </button>
            )}
          </div>
        ) : (
          filteredPersonas.map((persona) => {
            const firstLine =
              persona.description.split('\n').filter((l) => l.trim().length > 0)[0] ||
              '暂无设定描述';

            return (
              <div
                key={persona.id}
                onClick={() => {
                  setSelectedPersonaId(persona.id);
                  setPersonaSubView('detail');
                }}
                className="flex items-center px-4 py-3.5 bg-white active:bg-neutral-50 transition-colors cursor-pointer select-none"
              >
                {/* Avatar with first char */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#3a3a3c] to-[#636366] text-white flex items-center justify-center shrink-0 shadow-xs mr-3">
                  <span className="text-[15px] font-semibold">
                    {persona.name.slice(0, 1) || '人'}
                  </span>
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                    {persona.name}
                  </h3>
                  <p className="text-[13px] text-neutral-500 truncate leading-snug mt-0.5">
                    {firstLine}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={17} className="text-neutral-300 shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
