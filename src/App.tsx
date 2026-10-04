import React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { PhoneFrame } from './components/PhoneFrame';
import { HomeScreen } from './components/HomeScreen';
import { ChatApp } from './components/chat/ChatApp';
import { SettingsApp } from './components/settings/SettingsApp';
import { PersonasApp } from './components/personas/PersonasApp';
import { CalculatorApp } from './components/calculator/CalculatorApp';
import { NotesApp } from './components/notes/NotesApp';
import { RemindersApp } from './components/reminders/RemindersApp';
import { ClockApp } from './components/clock/ClockApp';
import { WeatherApp } from './components/weather/WeatherApp';

const AppContent: React.FC = () => {
  const { activeApp, goHome } = useChat();

  // Listen for Escape key to return to home desktop
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        goHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goHome]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {/* Home Screen */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'home'
            ? 'opacity-100 scale-100 pointer-events-auto z-10'
            : 'opacity-0 scale-95 pointer-events-none z-0'
        }`}
      >
        <HomeScreen />
      </div>

      {/* Chat App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'chat'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'chat' && <ChatApp />}
      </div>

      {/* Settings App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'settings'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'settings' && <SettingsApp />}
      </div>

      {/* Personas App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'personas'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'personas' && <PersonasApp />}
      </div>

      {/* Calculator App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'calculator'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'calculator' && <CalculatorApp />}
      </div>

      {/* Notes App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'notes'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'notes' && <NotesApp />}
      </div>

      {/* Reminders App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'reminders'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'reminders' && <RemindersApp />}
      </div>

      {/* Clock App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'clock'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'clock' && <ClockApp />}
      </div>

      {/* Weather App */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${
          activeApp === 'weather'
            ? 'opacity-100 scale-100 pointer-events-auto z-20'
            : 'opacity-0 scale-105 pointer-events-none z-0'
        }`}
      >
        {activeApp === 'weather' && <WeatherApp />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ChatProvider>
      <PhoneFrame>
        <AppContent />
      </PhoneFrame>
    </ChatProvider>
  );
}
