import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Select } from '../components/UI/Select';
import { Pagination } from '../components/UI/Pagination';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Eye, ChevronRight, FileText } from 'lucide-react';

export const ChallanList: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [challans, setChallans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Filter and Search states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [page, setPage] = useState(1);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const statusParam = status ? `&status=${status}` : '';
      const custParam = customerId ? `&customerId=${customerId}` : '';
      
      const res = await api.get(`/challans?page=${page}&limit=10${searchParam}${statusParam}${custParam}`);
      if (res.data.success) {
        setChallans(res.data.data.challans);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      addToast('Failed to load sales challans list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, status, customerId]);

  // Load customers for filter list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers?limit=100');
        if (res.data.success) {
          setCustomers(res.data.data.customers);
        }
      } catch (e) {
        console.error('Failed to load customers list', e);
      }
    };
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChallans();
  };

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Sales Challans Registry</h2>
          <p className="text-sm text-slate-400 mt-1">Book, verify, and confirm dispatch invoices for logistics</p>
        </div>
        
        {isSalesOrAdmin && (
          <Button 
            variant="primary" 
            onClick={() => navigate('/challans/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            Book Sales Challan
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Search Challans</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by sequential Challan Number (e.g. CH-000001)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="w-full md:w-56">
            <Select
              label="Filter Partner"
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
              options={[
                { label: 'All Partners', value: '' },
                ...customers.map(c => ({ label: `${c.customerName} (${c.businessName})`, value: c.id }))
              ]}
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              label="Processing Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Draft Mode', value: 'DRAFT' },
                { label: 'Confirmed Dispatch', value: 'CONFIRMED' },
                { label: 'Cancelled Order', value: 'CANCELLED' },
              ]}
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full md:w-auto h-[38px] px-5">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Challan List Table */}
      {loading ? (
        <LoadingSpinner />
      ) : challans.length === 0 ? (
        <EmptyState 
          message="No challans found" 
          description="Click Book Sales Challan to initiate a new dispatch transaction." 
          icon={<FileText className="h-8 w-8 text-slate-500" />}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Challan Number', 'Partner / Business', 'Total Items', 'Invoice Amount', 'Created By', 'Dispatch Date', 'Status', 'Actions']}>
            {challans.map((chal) => (
              <tr key={chal.id} className="hover:bg-slate-900/20">
                <td className="px-4 py-4 font-mono font-bold text-indigo-400">{chal.challanNumber}</td>
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-200">{chal.customer?.customerName}</div>
                  <div className="text-[10px] text-slate-550 font-semibold mt-0.5">{chal.customer?.businessName}</div>
                </td>
                <td className="px-4 py-4 font-semibold text-center">{chal.totalQuantity} items</td>
                <td className="px-4 py-4 font-extrabold text-slate-250">₹{chal.totalAmount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-300 text-xs">{chal.creator?.name}</div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">{chal.creator?.role}</div>
                </td>
                <td className="px-4 py-4 text-xs font-semibold text-slate-400">
                  {new Date(chal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-4">
                  <Badge value={chal.status} />
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => navigate(`/challans/${chal.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
                  >
                    Invoice
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </Card>
      )}
    </div>
  );
};
