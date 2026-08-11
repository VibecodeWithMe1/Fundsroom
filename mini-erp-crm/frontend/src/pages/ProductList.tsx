import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Select } from '../components/UI/Select';
import { Modal } from '../components/UI/Modal';
import { Input } from '../components/UI/Input';
import { Pagination } from '../components/UI/Pagination';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Edit2, RotateCw, AlertTriangle, ArrowUpDown, ClipboardList } from 'lucide-react';

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Stock Adjustment Modal states
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustProductName, setAdjustProductName] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
      const lowParam = lowStockOnly ? `&lowStockOnly=true` : '';
      
      const res = await api.get(`/products?page=${page}&limit=10${searchParam}${catParam}${lowParam}`);
      if (res.data.success) {
        setProducts(res.data.data.products);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      addToast('Failed to load catalog products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, lowStockOnly]);

  // Load categories list for dropdown filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products?limit=1000');
        if (res.data.success) {
          const list: string[] = res.data.data.products.map((p: any) => p.category);
          const uniqueCats = Array.from(new Set(list));
          setCategories(uniqueCats);
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openAdjustModal = (product: any) => {
    setAdjustProductId(product.id);
    setAdjustProductName(product.name);
    setAdjustQuantity(0);
    setAdjustReason('');
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) return;
    if (adjustQuantity === 0) {
      addToast('Adjustment quantity cannot be zero', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      addToast('Please enter a reason for stock adjustment', 'error');
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await api.post(`/products/${adjustProductId}/adjust`, {
        quantityChanged: adjustQuantity,
        reason: adjustReason,
      });

      if (res.data.success) {
        addToast('Stock level adjusted successfully', 'success');
        
        // Refresh products list in-place
        setProducts(prev => 
          prev.map(p => p.id === adjustProductId ? { 
            ...p, 
            currentStock: res.data.data.currentStock,
            status: res.data.data.currentStock <= p.minimumStock ? 'LOW STOCK' : 'NORMAL'
          } : p)
        );
        
        setAdjustProductId(null);
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to adjust stock level', 'error');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const canAdjustStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Product & Stock Inventory</h2>
          <p className="text-sm text-slate-400 mt-1">Monitor stock quantities, reorder points, and shelf locations</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/movements')}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4.5 w-4.5" />
            Stock Movements
          </Button>

          {isAdmin && (
            <Button 
              variant="primary" 
              onClick={() => navigate('/products/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Search Catalog</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="w-full md:w-56">
            <Select
              label="Category"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              options={[
                { label: 'All Categories', value: '' },
                ...categories.map(c => ({ label: c, value: c }))
              ]}
            />
          </div>

          {/* Low Stock Filter Toggle */}
          <div className="w-full md:w-auto h-[38px] flex items-center justify-start md:justify-center">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-300 select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
                className="h-4.5 w-4.5 bg-slate-900 border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
              />
              Show Low Stock Only
            </label>
          </div>

          <Button type="submit" variant="secondary" className="w-full md:w-auto h-[38px] px-5">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Product List Table */}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState 
          message="No products found" 
          description="Try broadening your search keywords or register a new product catalog entry." 
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Product Name', 'SKU', 'Category', 'Unit Price', 'Current Stock', 'Safety Minimum', 'Warehouse Shelf', 'Status', 'Actions']}>
            {products.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-900/20">
                <td className="px-4 py-4 font-bold text-slate-200">{prod.name}</td>
                <td className="px-4 py-4 font-mono font-medium text-indigo-400">{prod.sku}</td>
                <td className="px-4 py-4 text-xs font-semibold text-slate-400">{prod.category}</td>
                <td className="px-4 py-4 font-extrabold text-slate-250">₹{prod.unitPrice.toLocaleString('en-IN')}</td>
                <td className={`px-4 py-4 font-extrabold text-center ${prod.currentStock <= prod.minimumStock ? 'text-red-400' : 'text-slate-200'}`}>
                  {prod.currentStock}
                </td>
                <td className="px-4 py-4 text-center text-slate-500 font-semibold">{prod.minimumStock}</td>
                <td className="px-4 py-4 font-medium text-slate-400">{prod.warehouseLocation}</td>
                <td className="px-4 py-4">
                  <Badge value={prod.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {canAdjustStock && (
                      <button
                        onClick={() => openAdjustModal(prod)}
                        title="Adjust Stock Quantity"
                        className="p-1.5 rounded bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-900/20"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => navigate(`/products/${prod.id}/edit`)}
                        title="Edit Product Details"
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
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

      {/* Manual Stock Adjustment Dialog Modal */}
      <Modal
        isOpen={adjustProductId !== null}
        onClose={() => setAdjustProductId(null)}
        title={`Adjust Inventory Stock: ${adjustProductName}`}
      >
        <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock Quantity Delta</label>
            <input
              type="number"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
              placeholder="e.g. +10 for intake, -5 for write-offs"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-500">
              Input a <span className="font-semibold text-emerald-400">positive number</span> to increase stock, or a <span className="font-semibold text-red-400">negative number</span> to deduct stock.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Audit Adjustment Reason</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Purchase order dispatch PO-887, Broken item write-off"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={adjustSubmitting}
              onClick={() => setAdjustProductId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={adjustSubmitting}
            >
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
