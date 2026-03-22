import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/stores/ui.store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      <Sidebar />
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
