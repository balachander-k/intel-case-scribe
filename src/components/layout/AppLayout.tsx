import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pt-[108px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
