'use client';

import { useState } from 'react';
import { SwatchIcon } from '@heroicons/react/24/outline';
import useThemeStore from '@/lib/store/theme';
import CollapseTransition from '@/components/CollapseTransition';

export default function ThemeSettingItem() {
  const { mode, setTheme, getAvailableThemes } = useThemeStore();
  const [open, setOpen] = useState(false);

  const availableThemes = getAvailableThemes();

  const handleThemeChange = (newTheme: typeof mode) => {
    setTheme(newTheme);
  };

  const currentTheme = availableThemes.find(theme => theme.key === mode);

  return (
    <li
      className={`bg-theme-secondary border-4 border-theme-primary rounded-xl flex flex-col
        transition-all duration-300
        ${open ? 'shadow-theme-lg' : 'shadow-theme-sm'}
        hover:shadow-theme-lg
      `}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-theme-background border border-theme-border rounded-lg shadow-theme-sm hover:shadow-theme-md transition-all duration-300 text-theme-primary"
        aria-expanded={open}
        aria-controls="theme-settings-panel"
        tabIndex={-1}
      >
        <div className="flex items-center gap-3">
          <SwatchIcon className="w-5 h-5 text-theme-foreground" />
          <span className="text-base font-medium text-theme-foreground">Theme Settings</span>
        </div>
        <svg
          className={`w-5 h-5 text-theme-foreground transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <CollapseTransition
        isOpen={open}
        maxHeight="auto"
        expandedPadding="pt-4"
        collapsedPadding="p-0"
        className="overflow-y-auto"
        duration={300}
        easing="ease-linear"
      >
        <div className="space-y-6 px-4 pb-4">
          {/* Current Theme Display */}
          <div className="flex items-center justify-between py-3 border-b border-theme-border">
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-theme-border"
                style={{ backgroundColor: currentTheme?.primaryColor }}
              />
              <div>
                <label className="text-sm font-medium text-theme-foreground">
                  Current Theme: {currentTheme?.name}
                </label>
                <p className="text-xs text-theme-muted">
                  {currentTheme?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <h4 className="text-sm font-medium text-theme-foreground">Available Themes</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableThemes.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => handleThemeChange(theme.key)}
                  className={`relative bg-gradient-to-br from-theme-background to-theme-secondary border-2 rounded-xl p-3 hover:shadow-theme-md hover:scale-105 transition-all duration-300 cursor-pointer group ${mode === theme.key ? 'border-theme-primary shadow-theme-lg scale-105' : 'border-theme-border hover:border-theme-accent'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: theme.primaryColor,
                          boxShadow: `0 4px 12px ${theme.primaryColor}30`
                        }}
                      ></div>
                      {mode === theme.key && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-theme-primary border-2 border-white animate-pulse"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-theme-foreground font-semibold tracking-wide">{theme.name}</span>
                    </div>
                  </div>
                  {mode === theme.key && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-theme-primary/5 to-theme-primary/10 pointer-events-none"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-theme-accent rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTheme?.primaryColor }}
              ></div>
              <span className="text-sm font-medium text-theme-accent-foreground">
                {currentTheme?.name} theme is active
              </span>
            </div>
          </div>
        </div>
      </CollapseTransition>
    </li>
  );
} 