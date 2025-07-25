import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const ThemeControls: React.FC = () => {
  const { theme, setTheme } = useStore();

  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-gray-600" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>
    </div>
  );
};
