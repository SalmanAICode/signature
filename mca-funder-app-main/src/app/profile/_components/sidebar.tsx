'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
    key: string;
    label: string;
    path: string;
}

const menuItems: MenuItem[] = [
    { key: 'profile', label: 'Basic Information', path: '/profile' },
    { key: 'security', label: 'Account Security', path: '/profile/security' },
    { key: 'app-setting', label: 'App Settings', path: '/profile/app-setting' }
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const itemHeight = 48;
    const itemMarginBottom = 12;
    const itemFullHeight = itemHeight + itemMarginBottom;

    const [sliderTop, setSliderTop] = useState(0);

    useEffect(() => {
        const index = menuItems.findIndex(item => pathname === item.path);
        if (index >= 0) {
            setSliderTop(index * itemFullHeight);
        }
    }, [pathname]);

    const handleClick = (path: string) => {
        router.push(path);
    };

    return (
        <aside className="hidden md:block relative w-64 h-screen bg-theme-secondary border-r border-theme-border p-5 box-border select-none">
            <nav className="relative">
                <div
                    className="absolute left-0 w-1 bg-theme-primary rounded transition-all duration-300 ease-in-out"
                    style={{ top: sliderTop, height: itemHeight, zIndex: 20 }}
                />
                <div
                    className="absolute left-0 right-0 mx-2 rounded-md border-2 border-theme-primary shadow-md pointer-events-none transition-all duration-300 ease-in-out"
                    style={{ top: sliderTop, height: itemHeight, zIndex: 20 }}
                />

                <ul className="relative space-y-3">
                    {menuItems.map(({ key, label, path }) => {
                        const isSelected = pathname === path;
                        return (
                            <li
                                key={key}
                                onClick={() => handleClick(path)}
                                className={`
                                    relative pl-5 pr-4 py-3 cursor-pointer rounded-md mx-2
                                    transition-colors duration-300 ease-in-out
                                    ${isSelected ? 'text-theme-primary font-semibold bg-theme-accent' : 'text-theme-foreground hover:text-theme-primary hover:bg-theme-accent'}
                                `}
                                style={{ height: itemHeight }}
                            >
                                {label}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
