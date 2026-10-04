import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bookmark, Palette, User, Users, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { EditProfileModal } from './EditProfileModal';
import { FavoritesView } from './FavoritesView';
import { AestheticsView } from './AestheticsView';
import { MomentsView } from '../moments/MomentsView';
import { AccountSwitcherSheet } from './AccountSwitcherSheet';
import { CreateAltModal } from '../chat/CreateAltModal';

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    currentAccount,
    deleteAltAccount,
    favorites,
    conversations,
    moments,
    profileSubView,
    setProfileSubView,
    goHome,
  } = useChat();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isCreateAltOpen, setIsCreateAltOpen] = useState(false);

  // Subviews routing:
  if (profileSubView === 'favorites') {
    return <FavoritesView />;
  }

  if (profileSubView === 'aesthetics') {
    return <AestheticsView />;
  }

  if (profileSubView === 'view_profile') {
    return (
      <MomentsView
        isMyProfileOnly={true}
        onBackToProfile={() => setProfileSubView('main')}
      />
    );
  }

  const firstLetter = (userProfile.nickname?.trim() || '用').slice(0, 1);
  const contactsCount = conversations?.length || 0;
  const myPostsCount = moments.filter((m) => m.isUser).length;
  const myLikesCount = moments
    .filter((m) => m.isUser)
    .reduce((acc, m) => acc + (m.likes?.length || 0), 0);

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F2F7] select-none">
      {/* Top Header */}
      <div className="ios-safe-header pb-2 px-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
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
        </div>

        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          Personal Profile
        </h1>
      </div>

      {/* Main Profile Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card Header (Avatar + @username on left, Nickname + 3 stats on right) */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-black/[0.06]">
          <div className="flex items-center gap-4">
            {/* Left: Avatar & @username */}
            <div className="flex flex-col items-center shrink-0 w-[68px]">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#D4D5DC] flex items-center justify-center">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[24px] font-bold text-neutral-700">
                    {firstLetter}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-400 font-mono mt-1.5 truncate max-w-full text-center">
                {userProfile.username || '@user'}
              </span>
            </div>

            {/* Right: Nickname + Stats Row */}
            <div className="flex-1 min-w-0 pr-1">
              <h2 className="text-[18px] font-bold text-neutral-900 truncate leading-snug">
                {userProfile.nickname || '未设置昵称'}
              </h2>
              {userProfile.bio && (
                <p className="text-[12px] text-neutral-500 truncate mt-0.5 mb-2 leading-snug">
                  {userProfile.bio}
                </p>
              )}

              {/* 3 Stats Row: Posts, Contacts, Likes */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-black/[0.04] text-center">
                <div>
                  <span className="text-[15px] font-bold text-neutral-900 block leading-tight">
                    {myPostsCount}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                    Posts
                  </span>
                </div>
                <div>
                  <span className="text-[15px] font-bold text-neutral-900 block leading-tight">
                    {contactsCount}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                    Contacts
                  </span>
                </div>
                <div>
                  <span className="text-[15px] font-bold text-neutral-900 block leading-tight">
                    {myLikesCount}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                    Likes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Buttons Side-by-Side: Edit Profile & View Profile */}
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-[13px] font-semibold active:scale-95 transition-all text-center cursor-pointer shadow-2xs"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setProfileSubView('view_profile')}
              className="flex-1 py-2 px-3 bg-[#E5E5EA] hover:bg-[#DCDCE1] text-neutral-800 rounded-xl text-[13px] font-semibold active:scale-95 transition-all text-center cursor-pointer"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* Grouped List: 我的收藏, 美化 */}
        <div className="bg-white rounded-2xl shadow-xs border border-black/[0.06] overflow-hidden divide-y divide-black/[0.06]">
          {/* Row 1: 我的收藏 */}
          <button
            type="button"
            onClick={() => setProfileSubView('favorites')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <Bookmark size={16} />
              </div>
              <span className="text-[15px] font-medium text-neutral-900">
                我的收藏
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              {favorites.length > 0 && (
                <span className="text-[12px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                  {favorites.length}
                </span>
              )}
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </button>

          {/* Row 2: 美化 */}
          <button
            type="button"
            onClick={() => setProfileSubView('aesthetics')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <Palette size={16} />
              </div>
              <span className="text-[15px] font-medium text-neutral-900">
                美化
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="text-[12px] text-neutral-400">气泡与背景</span>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </button>

          {/* Row 3: 切换账号 (红棕色文字) */}
          <button
            type="button"
            onClick={() => setIsAccountSheetOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#8A3324]/10 text-[#8A3324] flex items-center justify-center">
                <Users size={16} />
              </div>
              <span className="text-[15px] font-medium text-[#8A3324]">
                切换账号
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="text-[12px] text-neutral-400">
                {currentAccount.nickname}
              </span>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          initialProfile={userProfile}
          onSave={updateUserProfile}
          onDeleteAltAccount={!currentAccount.isMain ? () => deleteAltAccount(currentAccount.id) : undefined}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Account Switcher Sheet */}
      <AccountSwitcherSheet
        isOpen={isAccountSheetOpen}
        onClose={() => setIsAccountSheetOpen(false)}
        onCreateAlt={() => {
          setIsAccountSheetOpen(false);
          setIsCreateAltOpen(true);
        }}
      />

      {/* Create Alt Modal (from Profile directly) */}
      <CreateAltModal
        isOpen={isCreateAltOpen}
        mode="direct_create"
        onClose={() => setIsCreateAltOpen(false)}
      />
    </div>
  );
};
