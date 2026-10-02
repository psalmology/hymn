import React from 'react';
import { useChat } from '../../context/ChatContext';
import { SettingsMain } from './SettingsMain';
import { ApiSettingsView } from './ApiSettingsView';
import { DataSettingsView } from './DataSettingsView';
import { AboutView } from './AboutView';

export const SettingsApp: React.FC = () => {
  const { settingsSubView } = useChat();

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F2F2F7]">
      {settingsSubView === 'main' && (
        <div className="w-full h-full animate-in fade-in duration-200">
          <SettingsMain />
        </div>
      )}
      {settingsSubView === 'api' && (
        <div className="w-full h-full animate-in slide-in-from-right duration-250">
          <ApiSettingsView />
        </div>
      )}
      {settingsSubView === 'data' && (
        <div className="w-full h-full animate-in slide-in-from-right duration-250">
          <DataSettingsView />
        </div>
      )}
      {settingsSubView === 'about' && (
        <div className="w-full h-full animate-in slide-in-from-right duration-250">
          <AboutView />
        </div>
      )}
    </div>
  );
};
