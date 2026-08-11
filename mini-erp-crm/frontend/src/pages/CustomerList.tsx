import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { Pagination } from '../components/UI/Pagination';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Eye, Edit2, Trash2, ShieldAlert } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Filter and Search states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [leadStage, setLeadStage] = useState('');
  const [page, setPage] = useState(1);

  // Deactivate dialog state
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const statusParam = status ? `&status=${status}` : '';
      const typeParam = customerType ? `&customerType=${customerType}` : '';
      const stageParam = leadStage ? `&leadStage=${leadStage}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      
      const res = await api.get(`/customers?page=${page}&limit=10${searchParam}${statusParam}${typeParam}${stageParam}`);
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      addToast('Failed to load customers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, status, customerType, leadStage]); // Refetch on filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setDeactivateLoading(true);
    try {
      const res = await api.delete(`/customers/${deactivateId}`);
      if (res.data.success) {
        addToast('Customer deactivated successfully', 'success');
        setCustomers(prev => 
          prev.map(c => c.id === deactivateId ? { ...c, status: 'INACTIVE' } : c)
        );
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to deactivate customer', 'error');
    } finally {
      setDeactivateLoading(false);
      setDeactivateId(null);
    }
  };

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Customer CRM Directory</h2>
          <p className="text-sm text-slate-400 mt-1">Manage leads, client details, and follow-up activities</p>
        </div>
        {isSalesOrAdmin && (
          <Button 
            variant="primary" 
            onClick={() => navigate('/customers/new')}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Search Customers</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, email, mobile..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="w-full md:w-48">
            <Select
              label="Lead Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Lead', value: 'LEAD' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
              ]}
            />
          </div>

          <div className="w-full md:w-40">
            <Select
              label="Customer Type"
              value={customerType}
              onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Retail', value: 'RETAIL' },
                { label: 'Wholesale', value: 'WHOLESALE' },
                { label: 'Distributor', value: 'DISTRIBUTOR' },
              ]}
            />
          </div>

          <div className="w-full md:w-40">
            <Select
              label="Lead Stage"
              value={leadStage}
              onChange={(e) => { setLeadStage(e.target.value); setPage(1); }}
              options={[
                { label: 'All Stages', value: '' },
                { label: 'New Lead', value: 'LEAD' },
                { label: 'Contacted', value: 'CONTACTED' },
                { label: 'Proposal Sent', value: 'PROPOSAL' },
                { label: 'Negotiation', value: 'NEGOTIATION' },
                { label: 'Won (Active)', value: 'WON' },
                { label: 'Lost (Inactive)', value: 'LOST' },
              ]}
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full md:w-auto h-[38px] px-5">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Customers Table */}
      {loading ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <EmptyState 
          message="No customers found" 
          description="Try broadening your search keywords or register a new customer above." 
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Customer / Company', 'Contact Details', 'Customer Type', 'CRM Status / Stage', 'Next Follow-up', 'Actions']}>
            {customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-slate-900/20">
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-200">{cust.customerName}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{cust.businessName}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs font-semibold text-slate-350">{cust.mobileNumber}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{cust.email}</div>
                </td>
                <td className="px-4 py-4">
                  <Badge value={cust.customerType} />
                </td>
                <td className="px-4 py-4 flex flex-wrap gap-1 mt-1.5 items-center">
                  <Badge value={cust.status} />
                  {cust.leadStage && <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{cust.leadStage}</span>}
                </td>
                <td className="px-4 py-4 text-xs font-bold text-slate-400">
                  {cust.followUpDate ? (
                    new Date(cust.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  ) : (
                    <span className="text-slate-650 font-normal">Not Scheduled</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/customers/${cust.id}`)}
                      title="Inspect Details"
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isSalesOrAdmin && (
                      <button
                        onClick={() => navigate(`/customers/${cust.id}/edit`)}
                        title="Edit Customer"
                        className="p-1.5 rounded bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-900/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin && cust.status !== 'INACTIVE' && (
                      <button
                        onClick={() => setDeactivateId(cust.id)}
                        title="Deactivate Customer"
                        className="p-1.5 rounded bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors border border-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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

      {/* Soft Delete / Deactivation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deactivateId !== null}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Customer Account"
        message="Are you sure you want to deactivate this customer? Their CRM status will be set to INACTIVE. This will not delete their historical challans."
        confirmText="Deactivate"
        isDanger={true}
        isLoading={deactivateLoading}
      />
    </div>
  );
};
