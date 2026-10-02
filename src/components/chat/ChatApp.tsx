import React from 'react';
import { MessageSquare, Users, Aperture, User } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ConversationList } from './ConversationList';
import { ContactsView } from './ContactsView';
import { MomentsView } from '../moments/MomentsView';
import { ProfileView } from '../profile/ProfileView';
import { ChatRoom } from './ChatRoom';
import { CharacterSettingsView } from './CharacterSettingsView';

export const ChatApp: React.FC = () => {
  const { chatSubView, chatTab, setChatTab } = useChat();

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F2F2F7] flex flex-col">
      {/* Main Tab Screen Area when in 'list' mode */}
      {chatSubView === 'list' && (
        <div className="flex-1 w-full overflow-hidden relative">
          {/* Tab 1: 消息 */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
              chatTab === 'messages' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {chatTab === 'messages' && <ConversationList />}
          </div>

          {/* Tab 2: 联系人 */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
              chatTab === 'contacts' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {chatTab === 'contacts' && <ContactsView />}
          </div>

          {/* Tab 3: 动态 */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
              chatTab === 'moments' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {chatTab === 'moments' && <MomentsView />}
          </div>

          {/* Tab 4: 主页 */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
              chatTab === 'profile' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {chatTab === 'profile' && <ProfileView />}
          </div>
        </div>
      )}

      {/* Full-Screen Chat Room or Settings (Hides Bottom Bar) */}
      {chatSubView === 'room' && (
        <div className="w-full h-full absolute inset-0 z-40 animate-in slide-in-from-right duration-250">
          <ChatRoom />
        </div>
      )}
      {chatSubView === 'settings' && (
        <div className="w-full h-full absolute inset-0 z-40 animate-in slide-in-from-right duration-250">
          <CharacterSettingsView />
        </div>
      )}

      {/* 4-Item Bottom Navigation Bar (Visible only when in 'list' mode) */}
      {chatSubView === 'list' && (
        <div className="h-[52px] bg-[#F2F2F7] border-t border-black/[0.08] flex items-center justify-around z-30 shrink-0 select-none pb-0">
          {/* Tab 1: 消息 */}
          <button
            type="button"
            onClick={() => setChatTab('messages')}
            className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
              chatTab === 'messages'
                ? 'text-[#1C1C1E]'
                : 'text-[#8E8E93] hover:text-neutral-600'
            }`}
          >
            <MessageSquare
              size={21}
              strokeWidth={chatTab === 'messages' ? 2.3 : 1.8}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              消息
            </span>
          </button>

          {/* Tab 2: 联系人 */}
          <button
            type="button"
            onClick={() => setChatTab('contacts')}
            className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
              chatTab === 'contacts'
                ? 'text-[#1C1C1E]'
                : 'text-[#8E8E93] hover:text-neutral-600'
            }`}
          >
            <Users
              size={21}
              strokeWidth={chatTab === 'contacts' ? 2.3 : 1.8}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              联系人
            </span>
          </button>

          {/* Tab 3: 动态 */}
          <button
            type="button"
            onClick={() => setChatTab('moments')}
            className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
              chatTab === 'moments'
                ? 'text-[#1C1C1E]'
                : 'text-[#8E8E93] hover:text-neutral-600'
            }`}
          >
            <Aperture
              size={21}
              strokeWidth={chatTab === 'moments' ? 2.3 : 1.8}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              动态
            </span>
          </button>

          {/* Tab 4: 主页 */}
          <button
            type="button"
            onClick={() => setChatTab('profile')}
            className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
              chatTab === 'profile'
                ? 'text-[#1C1C1E]'
                : 'text-[#8E8E93] hover:text-neutral-600'
            }`}
          >
            <User
              size={21}
              strokeWidth={chatTab === 'profile' ? 2.3 : 1.8}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              主页
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
