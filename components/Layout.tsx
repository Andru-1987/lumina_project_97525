import React from 'react';
import { Home, Calendar, Users, Settings, Bell, LogOut, PlusCircle, Building } from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifications?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate, unreadNotifications = 0 }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  // Icon mapping
  const IconHome = Home;
  const IconCalendar = Calendar;
  const IconUsers = Users;
  const IconSettings = Settings;

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-lg transition-colors duration-200
        ${currentPage === page ? 'text-sky-500 bg-sky-50 md:bg-slate-800 md:text-white' : 'text-slate-500 hover:text-slate-900 md:text-slate-400 md:hover:text-white md:hover:bg-slate-800'}
      `}
    >
      <Icon size={24} strokeWidth={currentPage === page ? 2.5 : 2} />
      <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <Building className="text-sky-500" />
            LUMINA
          </h1>
          <p className="text-xs text-slate-400 mt-1">Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {isAdmin ? (
            <>
              <NavItem page="admin-dashboard" icon={Home} label="Dashboard" />
              <NavItem page="admin-amenities" icon={PlusCircle} label="Amenities" />
              <NavItem page="admin-calendar" icon={IconCalendar} label="Reservations" />
              <NavItem page="admin-users" icon={IconUsers} label="Residents" />
              <NavItem page="admin-settings" icon={IconSettings} label="Settings" />
            </>
          ) : (
            <>
              <NavItem page="resident-dashboard" icon={Home} label="Book" />
              <NavItem page="resident-history" icon={IconCalendar} label="My Reservations" />
              <NavItem page="resident-notifications" icon={Bell} label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications})` : ''}`} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-slate-600" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full hover:bg-slate-800 rounded"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <header className="md:hidden bg-slate-900 text-white p-4 sticky top-0 z-20 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                 <Building className="text-sky-500" size={20} />
                 <span className="font-bold tracking-wide">LUMINA</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">{user.name}</span>
                <button onClick={onLogout}><LogOut size={18} className="text-slate-400" /></button>
            </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
         {isAdmin ? (
            <>
              <NavItem page="admin-dashboard" icon={Home} label="Home" />
              <NavItem page="admin-calendar" icon={IconCalendar} label="Calendar" />
              <NavItem page="admin-users" icon={IconUsers} label="People" />
              <NavItem page="admin-settings" icon={IconSettings} label="Config" />
            </>
          ) : (
            <>
              <NavItem page="resident-dashboard" icon={Home} label="Book" />
              <NavItem page="resident-history" icon={IconCalendar} label="My Trips" />
              <div className="relative">
                 <NavItem page="resident-notifications" icon={Bell} label="Alerts" />
                 {unreadNotifications > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
              </div>
            </>
          )}
      </nav>
    </div>
  );
};

export default Layout;