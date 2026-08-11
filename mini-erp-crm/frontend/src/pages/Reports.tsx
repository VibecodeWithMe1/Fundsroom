import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  Users, 
  PieChart as PieIcon, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface SalesByCategory {
  category: string;
  sales: number;
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  businessName: string;
  sales: number;
}

interface SalesTrend {
  month: string;
  sales: number;
}

interface InventoryForecast {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  qtySold30Days: number;
  avgDailySales: number;
  daysRemaining: number;
}

export const Reports: React.FC = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  
  const [inventoryForecast, setInventoryForecast] = useState<InventoryForecast[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'sales') {
          const res = await api.get('/reports/sales');
          if (res.data.success) {
            setSalesByCategory(res.data.data.salesByCategory);
            setTopCustomers(res.data.data.topCustomers);
            setSalesTrends(res.data.data.salesTrends);
          }
        } else {
          const res = await api.get('/reports/inventory-forecast');
          if (res.data.success) {
            setInventoryForecast(res.data.data);
          }
        }
      } catch (err) {
        addToast('Failed to load reports and analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [activeTab, addToast]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

  const getRiskStatus = (stock: number, daysLeft: number) => {
    if (stock === 0) {
      return { label: 'OUT OF STOCK', color: 'bg-red-500/10 text-red-400 border border-red-500/20' };
    }
    if (daysLeft === -1) {
      return { label: 'HEALTHY (NO SALES)', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    }
    if (daysLeft < 7) {
      return { label: 'CRITICAL (< 7 DAYS)', color: 'bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold animate-pulse' };
    }
    if (daysLeft < 30) {
      return { label: 'WARNING (< 30 DAYS)', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    }
    return { label: 'HEALTHY', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Reports & Intelligence</h2>
          <p className="text-sm text-slate-450 mt-0.5">Automated analytics, sales performance, and forecasting metrics</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'sales'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sales Analytics
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'inventory'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inventory Forecasts
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'sales' ? (
        <div className="space-y-6">
          {/* Top Row: Sales Trend Line Chart */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              Monthly Sales Value Trend
            </h3>
            {salesTrends.length === 0 ? (
              <EmptyState message="No sales trends" description="Please book a confirmed sales challan to compile trends." />
            ) : (
              <div className="h-80 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                      formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Monthly Revenue']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Bottom Grid: Category Breakdown & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Category Bar Chart */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <PieIcon className="h-4.5 w-4.5 text-indigo-400" />
                Revenue Share by Product Category
              </h3>
              {salesByCategory.length === 0 ? (
                <EmptyState message="No category analytics" description="Add sales logs to view breakdown." />
              ) : (
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                        formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Sales Revenue']}
                      />
                      <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Top Revenue Clients */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Users className="h-4.5 w-4.5 text-indigo-400" />
                Top Customer Accounts by Revenue
              </h3>
              {topCustomers.length === 0 ? (
                <EmptyState message="No client statistics" description="Customer purchases will list here." />
              ) : (
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="businessName" type="category" stroke="#64748b" fontSize={9} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                        formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Total Revenue']}
                      />
                      <Bar dataKey="sales" fill="#a855f7" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="flex flex-col gap-4">
          {/* Header Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-250 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-indigo-400" />
                Inventory Stock-Out Prediction System
              </h3>
              <p className="text-xs text-slate-500 mt-1">Estimates remaining stock days using product average daily sales rates over the past 30 days.</p>
            </div>
          </div>

          {/* Forecasting Table */}
          <div className="overflow-x-auto scrollbar-thin">
            {inventoryForecast.length === 0 ? (
              <EmptyState message="No inventory products" description="Please add products to enable stock-out tracking." />
            ) : (
              <table className="w-full text-left text-xs text-slate-350">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold">
                    <th className="py-3 px-2">Product Name</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2 text-center">Current Stock</th>
                    <th className="py-3 px-2 text-center">30d Sales Qty</th>
                    <th className="py-3 px-2 text-center">Sales Rate/Day</th>
                    <th className="py-3 px-2 text-center">Forecast Days Left</th>
                    <th className="py-3 px-2 text-right">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {inventoryForecast.map((item) => {
                    const status = getRiskStatus(item.currentStock, item.daysRemaining);
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-2 font-bold text-slate-200">{item.name}</td>
                        <td className="py-4 px-2 font-mono font-medium text-slate-400">{item.sku}</td>
                        <td className="py-4 px-2 text-slate-400">{item.category}</td>
                        <td className="py-4 px-2 text-center font-bold">{item.currentStock} units</td>
                        <td className="py-4 px-2 text-center text-slate-400 font-semibold">{item.qtySold30Days} units</td>
                        <td className="py-4 px-2 text-center font-mono font-bold text-indigo-400">{item.avgDailySales}</td>
                        <td className="py-4 px-2 text-center font-bold">
                          {item.daysRemaining === -1 ? (
                            <span className="text-slate-500">∞ (No sales)</span>
                          ) : item.daysRemaining === 0 ? (
                            <span className="text-red-500">0 days</span>
                          ) : (
                            <span className={item.daysRemaining < 7 ? 'text-red-400' : item.daysRemaining < 30 ? 'text-amber-400' : 'text-emerald-400'}>
                              {item.daysRemaining} days
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
