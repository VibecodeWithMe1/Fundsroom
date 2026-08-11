import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Badge } from '../components/UI/Badge';
import { Pagination } from '../components/UI/Pagination';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export const InventoryMovements: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory/movements?page=${page}&limit=20`);
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      addToast('Failed to load stock movements audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Stock Movement Ledger
            <Shield className="h-5 w-5 text-indigo-400 shrink-0" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">Read-only audit trail logging every inventory change</p>
        </div>
      </div>

      {/* Movements Table */}
      {loading ? (
        <LoadingSpinner />
      ) : movements.length === 0 ? (
        <EmptyState 
          message="No stock movements recorded" 
          description="Every stock increment or deduction is logged automatically." 
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Product Detail', 'Quantity Shift', 'Action Type', 'Audit Reason', 'Authorized User', 'Timestamp']}>
            {movements.map((move) => {
              const isIncrement = move.movementType === 'IN';
              return (
                <tr key={move.id} className="hover:bg-slate-900/10">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-200">{move.product?.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">SKU: {move.product?.sku}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 font-extrabold text-sm ${isIncrement ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isIncrement ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                      {isIncrement ? '+' : '-'}{move.quantityChanged}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge value={move.movementType} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-slate-300 text-xs bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                      {move.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-250 text-xs">{move.creator?.name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase">{move.creator?.role}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold">
                    {new Date(move.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="block text-[10px] text-slate-600 mt-0.5">
                      {new Date(move.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              );
            })}
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
