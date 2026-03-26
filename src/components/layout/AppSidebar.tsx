import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, List, FileText, Zap } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: List, label: 'Request Register' },
  { to: '/create', icon: Plus, label: 'New Request' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 animate-slide-down">
      {/* Top brand bar with gradient */}
      <div className="bg-gradient-to-r from-primary via-primary to-[hsl(20,100%,42%)]">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-primary-foreground tracking-tight">
                RequestIQMS
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-primary-foreground/70 font-medium">
                Internal Operations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur text-primary-foreground text-xs font-semibold">
              <Zap className="h-3 w-3" />
              AI-Powered
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-card/95 backdrop-blur-md border-b shadow-ink">
        <div className="max-w-[1400px] mx-auto px-6">
          <nav className="flex items-center gap-1 h-12">
            {navItems.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {item.label}
                  {/* Animated underline */}
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-primary transition-all duration-300 ${
                    isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-75 group-hover:opacity-50'
                  }`} />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
