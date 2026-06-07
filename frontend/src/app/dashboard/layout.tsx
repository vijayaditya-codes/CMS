'use client';

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  LogOut, 
  Loader2,
  User as UserIcon
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-955 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400 font-medium">Loading panel workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Learners', href: '/dashboard/learners', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Sidebar Header / Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              AuraCMS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group border ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-md shadow-indigo-900/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile Card */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-850 border border-slate-700/80 rounded-full flex items-center justify-center text-slate-300">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.25 rounded uppercase tracking-wider ${
                  user.role === 'ADMIN' 
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Work Area Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Minimal Bar */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 md:px-8 bg-slate-900/20 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-slate-400">
            {pathname === '/dashboard' ? 'Overview Statistics' : pathname.includes('/courses') ? 'Courses Management' : 'Learners Workspace'}
          </h2>
          <div className="text-xs text-slate-500">
            System time: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* Page Content Render */}
        <div className="flex-1 p-6 md:p-8 bg-slate-950/40">
          {children}
        </div>
      </main>

    </div>
  );
}
