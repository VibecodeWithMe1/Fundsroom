import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  Package, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface KPIState {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  draftChallans: number;
  confirmedChallans: number;
  todayChallans: number;
}

interface RecentChallan {
  id: string;
  challanNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer: {
    customerName: string;
    businessName: string;
  };
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  category: string;
  warehouseLocation: string;
}

interface UpcomingFollowUp {
  id: string;
  customerName: string;
  businessName: string;
  followUpDate: string;
  status: string;
}

interface ChartData {
  month: string;
  sales: number;
}

export const Dashboard: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIState | null>(null);
  const [recentChallans, setRecentChallans] = useState<RecentChallan[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<UpcomingFollowUp[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data.success) {
          const { kpis, recentChallans, lowStockProducts, upcomingFollowUps, salesChartData } = res.data.data;
          setKpis(kpis);
          setRecentChallans(recentChallans);
          setLowStockProducts(lowStockProducts);
          setUpcomingFollowUps(upcomingFollowUps);
          setChartData(salesChartData);
        }
      } catch (err) {
        addToast('Failed to load dashboard statistics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [addToast]);

  if (loading) return <LoadingSpinner />;

  const kpiCards = [
    { name: 'Total Customers', value: kpis?.totalCustomers || 0, sub: `${kpis?.activeCustomers || 0} active CRM leads`, icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
    { name: 'Catalog Products', value: kpis?.totalProducts || 0, sub: 'Items in active catalog', icon: Package, color: 'text-sky-400 bg-sky-500/10' },
    { name: 'Low Stock Alerts', value: kpis?.lowStockProducts || 0, sub: 'Needs reorder replenishment', icon: AlertTriangle, color: (kpis?.lowStockProducts || 0) > 0 ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-500/10' },
    { name: 'Today\'s Challans', value: kpis?.todayChallans || 0, sub: `${kpis?.confirmedChallans || 0} total confirmed challans`, icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Operations Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Real-time status overview and CRM lead operations</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5">
              <div className={`p-3.5 rounded-xl shrink-0 ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{card.value}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{card.sub}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Area */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              Revenue Analytics (Last 6 Months)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Updated live</span>
          </div>
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming Followups */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-amber-400" />
              Upcoming CRM Follow-ups
            </h3>
            <Link to="/customers" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5">
              View CRM
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin max-h-72">
            {upcomingFollowUps.length === 0 ? (
              <div className="h-full flex items-center justify-center py-10">
                <EmptyState 
                  message="No upcoming follow-ups" 
                  description="All customer follow-up actions have been successfully log-closed." 
                />
              </div>
            ) : (
              upcomingFollowUps.map((follow) => (
                <div 
                  key={follow.id} 
                  onClick={() => navigate(`/customers/${follow.id}`)}
                  className="p-3.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all duration-200 flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-200 truncate max-w-[150px]">
                      {follow.customerName}
                    </h4>
                    <Badge value={follow.status} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-450 mt-0.5">
                    <span className="truncate max-w-[140px]">{follow.businessName}</span>
                    <span className="font-semibold text-amber-400">
                      {new Date(follow.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Low Stock Alerts & Recent Challans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
              Low Stock Warnings
            </h3>
            <Link to="/products?lowStockOnly=true" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5">
              Manage Inventory
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            {lowStockProducts.length === 0 ? (
              <EmptyState 
                message="Inventory level healthy" 
                description="All catalog items are stocked safely above their defined safety limits." 
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
              />
            ) : (
              <table className="w-full text-left text-xs text-slate-350">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-450 uppercase">
                    <th className="py-2.5">Product Name</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5 text-center">Stock</th>
                    <th className="py-2.5 text-center">Min Safety</th>
                    <th className="py-2.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {lowStockProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-900/30">
                      <td className="py-3 font-bold text-slate-200">{prod.name}</td>
                      <td className="py-3 font-mono">{prod.sku}</td>
                      <td className="py-3 text-center text-red-400 font-extrabold">{prod.currentStock}</td>
                      <td className="py-3 text-center text-slate-500 font-semibold">{prod.minimumStock}</td>
                      <td className="py-3 text-slate-400">{prod.warehouseLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Recent Challans */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sky-400" />
              Recent Sales Challans
            </h3>
            <Link to="/challans" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5">
              View All Orders
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            {recentChallans.length === 0 ? (
              <EmptyState 
                message="No recent challans" 
                description="Start operations by booking a new sales challan." 
              />
            ) : (
              <table className="w-full text-left text-xs text-slate-350">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-450 uppercase">
                    <th className="py-2.5">Challan No</th>
                    <th className="py-2.5">Customer / Business</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Invoice Amount</th>
                    <th className="py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {recentChallans.map((chal) => (
                    <tr 
                      key={chal.id} 
                      onClick={() => navigate(`/challans/${chal.id}`)}
                      className="hover:bg-slate-900/30 cursor-pointer"
                    >
                      <td className="py-3 font-mono font-bold text-indigo-400">{chal.challanNumber}</td>
                      <td className="py-3">
                        <div className="font-bold text-slate-200">{chal.customer.customerName}</div>
                        <div className="text-[10px] text-slate-500">{chal.customer.businessName}</div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge value={chal.status} />
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-200">
                        ₹{chal.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        {new Date(chal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
