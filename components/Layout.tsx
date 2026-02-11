import React from 'react';
import { Home, Calendar, Users, Settings, Bell, LogOut, PlusCircle, Building, LucideIcon } from 'lucide-react';
import { User, UserRole } from '../types';

interface NavItemProps {
  page: string;
  icon: LucideIcon;
  label: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem = React.memo(({ page, icon: Icon, label, currentPage, onNavigate }: NavItemProps) => (
  <button
    onClick={() => onNavigate(page)}
    className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-2.5 rounded-btn transition-all duration-200
      ${currentPage === page
        ? 'text-primary-600 bg-primary-50 font-semibold md:bg-primary-50 md:text-primary-600 md:shadow-sm'
        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 md:text-neutral-500 md:hover:text-neutral-900 md:hover:bg-neutral-100'
      }
    `}
  >
    <Icon size={22} strokeWidth={currentPage === page ? 2.5 : 1.8} />
    <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
  </button>
));

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
    <div className="min-h-screen bg-neutral-50 md:flex">
      {/* Desktop Sidebar — Light theme */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 fixed h-full z-20">
        <div className="p-6 border-b border-neutral-100">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2 text-neutral-900">
            <Building className="text-primary-500" />
            LUMINA
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {isAdmin ? (
            <>
              <NavItem page="admin-dashboard" icon={Home} label="Dashboard" currentPage={currentPage} onNavigate={onNavigate} />
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

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border-2 border-neutral-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-600 w-full hover:bg-red-50 rounded-btn transition-colors duration-200"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Mobile Header — Light theme */}
        <header className="md:hidden bg-white text-neutral-900 p-4 sticky top-0 z-20 flex justify-between items-center shadow-card border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Building className="text-primary-500" size={20} />
            <span className="font-bold tracking-wide">LUMINA</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{user.name}</span>
            <button onClick={onLogout}><LogOut size={18} className="text-neutral-400 hover:text-red-500 transition-colors" /></button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav — Light theme */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-2 flex justify-around items-center z-30 shadow-dropdown">
        {isAdmin ? (
          <>
            <NavItem page="admin-dashboard" icon={Home} label="Home" currentPage={currentPage} onNavigate={onNavigate} />
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
              {unreadNotifications > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;