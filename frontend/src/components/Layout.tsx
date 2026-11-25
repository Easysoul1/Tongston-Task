import { Link, useLocation, NavLink, Outlet } from 'react-router-dom';
import { FileText, History, Coins, LogOut, Menu } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './ui/Form';
import { useAuthStore } from '../store';
import { useToast } from './ui/Toast';
import { useState } from 'react';

const navItems = [
  { path: '/content', label: 'Content', icon: FileText },
  { path: '/ai-runs', label: 'AI Runs', icon: History },
  { path: '/tokens', label: 'Tokens', icon: Coins },
];

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({ type: 'info', title: 'Logged out', message: 'You have been signed out' });
  };

  return (
    <div className="min-h-dvh bg-surface-50 lg:flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-surface-200 transition-transform duration-200 lg:sticky lg:top-0 lg:bottom-auto lg:h-dvh lg:self-start',
          sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="p-6 border-b border-surface-200">
            <Link to="/content" className="flex items-center gap-2" aria-label="Tongston T-Cell Admin">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <span className="font-semibold text-lg text-surface-900">Tongston</span>
            </Link>
            <p className="mt-1 text-xs text-surface-500">T-Cell Admin</p>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-surface-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{user?.email}</p>
                <p className="text-xs text-surface-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 min-h-dvh flex-1">
        {/* Mobile header - only on mobile */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-surface-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
            <span className="font-semibold text-surface-900">Tongston</span>
            <div className="w-10" />
          </div>
        </header>

        {/* Main content area - responsive padding and min-height */}
        <div className="px-4 pt-4 pb-8 lg:p-6 min-h-[calc(100dvh_-_4rem)] lg:min-h-[calc(100dvh)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}