import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useOrg } from '@/hooks/useOrg';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const { data: org } = useOrg();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-6">
      {/* Org name */}
      <div className="text-sm font-medium text-slate-400">
        {org?.name ?? 'Loading...'}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {initials}
          </div>
          <span className="hidden text-sm text-slate-300 sm:inline">
            {user?.name ?? user?.email}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
