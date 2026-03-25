'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  Leaf,
  Menu,
  X,
  Home,
  BookOpen,
  Calendar,
  MessageSquare,
  ShoppingBag,
  Map as MapIcon,
  User,
  LogOut,
  LogIn,
  Book,
  Mail,
  Users,
  Handshake
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const publicNavigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Блог', href: '/blog', icon: BookOpen },
  { name: 'Календарь', href: '/calendar', icon: Calendar },
  { name: 'Форум', href: '/forum', icon: MessageSquare },
  { name: 'Объявления', href: '/marketplace', icon: ShoppingBag },
  { name: 'Карта', href: '/map', icon: MapIcon },
];

const privateNavigation = [
  { name: 'Личный кабинет', href: '/dashboard', icon: User },
  { name: 'Дневник посадок', href: '/diary', icon: Book },
  { name: 'Сообщения', href: '/messages', icon: Mail },
  { name: 'Обмены', href: '/exchanges', icon: Handshake },
  { name: 'Клубы', href: '/clubs', icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigation = isAuthenticated
    ? [...publicNavigation, { name: '---', href: '#', icon: () => null }, ...privateNavigation]
    : publicNavigation;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col md:flex-row">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-stone-100 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 bg-emerald-950">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-emerald-50">
            <Leaf className="h-6 w-6 text-emerald-400" />
            <span className='text-xl'>Городской Садовод</span>
          </Link>
          <button
            className="md:hidden text-stone-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] pb-20">
          {navigation.map((item, index) => {
            if (item.name === '---') {
              return <div key={index} className="my-4 border-t border-emerald-800/50" />;
            }
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-emerald-800 text-white font-medium"
                    : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-stone-200 sticky top-0 z-30">
          <button
            className="md:hidden text-stone-500 hover:text-stone-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex justify-end items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-stone-700 hidden sm:block">
                  {user?.username}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Войти
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
