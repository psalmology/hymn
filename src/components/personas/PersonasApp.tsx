import React from 'react';
import { useChat } from '../../context/ChatContext';
import { PersonaListView } from './PersonaListView';
import { PersonaCreateView } from './PersonaCreateView';
import { PersonaDetailView } from './PersonaDetailView';

export const PersonasApp: React.FC = () => {
  const { personaSubView } = useChat();

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F2F2F7]">
      {personaSubView === 'list' && (
        <div className="w-full h-full animate-in fade-in duration-200">
          <PersonaListView />
        </div>
      )}
      {personaSubView === 'create' && (
        <div className="w-full h-full animate-in slide-in-from-right duration-250">
          <PersonaCreateView />
        </div>
      )}
      {personaSubView === 'detail' && (
        <div className="w-full h-full animate-in slide-in-from-right duration-250">
          <PersonaDetailView />
        </div>
      )}
    </div>
  );
};
