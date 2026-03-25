import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, List, FileText } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: List, label: 'Request Register' },
  { to: '/create', icon: Plus, label: 'New Request' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col z-30">
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <FileText className="h-5 w-5 text-sidebar-primary mr-2.5" />
        <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">
          RequestIQ
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-muted">Internal Operations</p>
      </div>
    </aside>
  );
}
