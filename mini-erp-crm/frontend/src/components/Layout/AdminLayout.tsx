import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ClipboardList, 
  UserCog, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Activity,
  BarChart3,
  Bell,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers (CRM)', path: '/customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Inventory Logs', path: '/inventory/movements', icon: Activity, roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Sales Challans', path: '/challans', icon: ClipboardList, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] },
    { name: 'User Management', path: '/users', icon: UserCog, roles: ['ADMIN'] },
  ];

  const activeItem = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'SALES': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'WAREHOUSE': return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'ACCOUNTS': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      default: return 'bg-slate-550/10 text-slate-400 border border-slate-700/20';
    }
  };

  const [alerts, setAlerts] = useState<{ lowStock: any[]; followUps: any[]; totalCount: number }>({ lowStock: [], followUps: [], totalCount: 0 });
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/dashboard/alerts');
        if (res.data.success) {
          setAlerts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar drawer for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Brand area */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-650 bg-clip-text text-transparent uppercase">
              Operations Portal
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              if (item.roles && !item.roles.includes(user?.role || '')) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeItem(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                    }
                  `}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.name}</p>
              <p className="text-xs truncate text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-800 text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-slate-800 flex items-center justify-between px-6 shrink-0 print:hidden relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:bg-slate-900 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-base font-semibold text-slate-200 hidden sm:block">
              {location.pathname === '/dashboard' ? 'Welcome back' : 'Operations management'}
            </h1>
          </div>

          <div className="flex items-center gap-4 z-55">
            {/* Alerts Bell notification button */}
            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all relative hover:scale-105 focus:outline-none"
              >
                <Bell className="h-4.5 w-4.5" />
                {alerts.totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-650 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold animate-pulse">
                    {alerts.totalCount}
                  </span>
                )}
              </button>

              {/* Dropdown notification list */}
              {isAlertsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 md:w-96 glass-panel rounded-xl shadow-2xl p-4 z-50 animate-fade-in-up space-y-3.5 max-h-[400px] overflow-y-auto scrollbar-thin">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                        <Bell className="h-4 w-4 text-indigo-400" />
                        Operational Alerts ({alerts.totalCount})
                      </h4>
                      <button onClick={() => setIsAlertsOpen(false)} className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase">
                        Dismiss
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {alerts.totalCount === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 italic">
                          All systems normal. No low stock or due followups.
                        </div>
                      ) : (
                        <>
                          {alerts.lowStock.map((prod: any) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setIsAlertsOpen(false);
                                navigate('/products');
                              }}
                              className="p-3 rounded-lg border border-red-900/20 bg-red-950/10 hover:bg-red-950/20 transition-all cursor-pointer flex gap-3 text-xs leading-relaxed text-slate-350 hover:border-red-900/40"
                            >
                              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-200">Low Stock: {prod.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">SKU: {prod.sku} | Stock: <span className="text-red-400 font-extrabold">{prod.currentStock}</span> (Safety: {prod.minimumStock})</p>
                              </div>
                            </div>
                          ))}

                          {alerts.followUps.map((follow: any) => (
                            <div
                              key={follow.id}
                              onClick={() => {
                                setIsAlertsOpen(false);
                                navigate(`/customers/${follow.id}`);
                              }}
                              className="p-3 rounded-lg border border-amber-900/20 bg-amber-950/10 hover:bg-amber-950/20 transition-all cursor-pointer flex gap-3 text-xs leading-relaxed text-slate-350 hover:border-amber-900/40"
                            >
                              <Calendar className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-200">Follow-up Call: {follow.customerName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{follow.businessName} | Scheduled today</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(user?.role || '')}`}>
              {user?.role}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
