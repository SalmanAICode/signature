'use client';

import ThemeSettingItem from './_components/ThemeSettingItem';

export default function AppSettingPage() {
  return (
    <div className="w-full rounded-2xl mx-auto p-8 min-h-screen bg-theme-secondary text-theme-foreground flex flex-col md:flex-row md:space-x-12">
      <ul className="space-y-6 w-full md:w-1/2">
        <ThemeSettingItem />
      </ul>
    </div>
  );
} 