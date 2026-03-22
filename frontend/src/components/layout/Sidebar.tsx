import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Search,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/servers', label: 'Servers', icon: Server },
  { to: '/scans', label: 'Scans', icon: Search },
  { to: '/findings', label: 'Findings', icon: AlertTriangle },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-700 bg-slate-900 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4">
        <Shield className="h-6 w-6 shrink-0 text-blue-400" />
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-slate-100">
            GuardianMCP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                sidebarCollapsed && 'justify-center px-2',
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-slate-700 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
