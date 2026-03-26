import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, List, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: List, label: 'Request Register' },
  { to: '/create', icon: Plus, label: 'New Request' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-card border-b border-border">
      {/* Top brand bar */}
      <div className="bg-primary">
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-primary-foreground" />
            <span className="text-base font-bold text-primary-foreground tracking-tight">
              RequestIQ
            </span>
          </div>
          <span className="text-xs text-primary-foreground/80 font-medium">Internal Operations Portal</span>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="max-w-[1400px] mx-auto px-6">
        <nav className="flex items-center gap-1 h-12">
          {navItems.map((item) => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'text-primary border-b-[3px] border-primary rounded-b-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
