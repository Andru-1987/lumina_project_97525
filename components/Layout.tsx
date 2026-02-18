import React from 'react';
import { Home, Calendar, Users, Settings, Bell, LogOut, PlusCircle, Building, LucideIcon, TrendingUp } from 'lucide-react';
import { User, UserRole } from '../types';

interface NavItemProps {
  page: string;
  icon: LucideIcon;
  label: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem = React.memo(({ page, icon: Icon, label, currentPage, onNavigate }: NavItemProps) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-2.5 rounded-lg transition-all duration-200 relative
        ${isActive
          ? 'text-sky-500 bg-sky-50/80 md:bg-sky-500/10 md:text-sky-400'
          : 'text-slate-400 hover:text-slate-700 md:text-slate-400 md:hover:text-white md:hover:bg-white/5'
        }`}
    >
      <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
      <span className={`text-[10px] md:text-sm mt-1 md:mt-0 ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      {/* Active indicator for desktop */}
      {isActive && <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sky-400 rounded-r-full"></span>}
    </button>
  );
});

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

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 text-white fixed h-full z-20 border-r border-slate-800">
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-wider flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
              <Building size={16} strokeWidth={2} />
            </div>
            LUMINA
          </h1>
          <p className="text-[11px] text-slate-500 mt-1 ml-[42px] font-medium tracking-wide">Management System</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {isAdmin ? (
            <>
              <NavItem page="admin-dashboard" icon={Home} label="Dashboard" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="admin-analytics" icon={TrendingUp} label="Analytics" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="admin-amenities" icon={PlusCircle} label="Amenities" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="admin-calendar" icon={Calendar} label="Reservations" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="admin-users" icon={Users} label="Residents" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="admin-settings" icon={Settings} label="Settings" currentPage={currentPage} onNavigate={onNavigate} />
            </>
          ) : (
            <>
              <NavItem page="resident-dashboard" icon={Home} label="Book" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="resident-history" icon={Calendar} label="My Reservations" currentPage={currentPage} onNavigate={onNavigate} />
              <NavItem page="resident-notifications" icon={Bell} label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications})` : ''}`} currentPage={currentPage} onNavigate={onNavigate} />
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-white/5">
            <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-white/10" />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate font-medium">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full hover:bg-red-500/10 rounded-lg transition-colors duration-200"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <header className="md:hidden bg-white/80 backdrop-blur-lg text-slate-900 p-4 sticky top-0 z-20 flex justify-between items-center border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center text-white">
              <Building size={14} strokeWidth={2} />
            </div>
            <span className="font-bold tracking-wide text-sm">LUMINA</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">{user.name}</span>
            <button onClick={onLogout} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
              <LogOut size={15} className="text-slate-400" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {isAdmin ? (
          <>
            <NavItem page="admin-dashboard" icon={Home} label="Home" currentPage={currentPage} onNavigate={onNavigate} />
            <NavItem page="admin-analytics" icon={TrendingUp} label="Analytics" currentPage={currentPage} onNavigate={onNavigate} />
            <NavItem page="admin-calendar" icon={Calendar} label="Calendar" currentPage={currentPage} onNavigate={onNavigate} />
            <NavItem page="admin-users" icon={Users} label="People" currentPage={currentPage} onNavigate={onNavigate} />
            <NavItem page="admin-settings" icon={Settings} label="Config" currentPage={currentPage} onNavigate={onNavigate} />
          </>
        ) : (
          <>
            <NavItem page="resident-dashboard" icon={Home} label="Book" currentPage={currentPage} onNavigate={onNavigate} />
            <NavItem page="resident-history" icon={Calendar} label="My Trips" currentPage={currentPage} onNavigate={onNavigate} />
            <div className="relative">
              <NavItem page="resident-notifications" icon={Bell} label="Alerts" currentPage={currentPage} onNavigate={onNavigate} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-badge-pop">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;