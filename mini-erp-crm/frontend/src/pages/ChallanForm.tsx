import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Select } from '../components/UI/Select';
import { Input } from '../components/UI/Input';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Plus, Trash2, ShoppingBag, Info, AlertCircle } from 'lucide-react';

interface SelectedItem {
  productId: string;
  quantity: number;
  sku: string;
  name: string;
  unitPrice: number;
  availableStock: number;
  error?: string;
}

export const ChallanForm: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers?limit=100&status=ACTIVE'), // Seed active customers
          api.get('/products?limit=500'), // Seed products
        ]);

        if (custRes.data.success) {
          setCustomers(custRes.data.data.customers);
          if (preselectedCustomerId) {
            setCustomerId(preselectedCustomerId);
          }
        }
        if (prodRes.data.success) {
          setProducts(prodRes.data.data.products);
        }
      } catch (err) {
        addToast('Failed to load customers or products list', 'error');
        navigate('/challans');
      } finally {
        setLoading(false);
      }
    };
    loadFormData();
  }, [preselectedCustomerId, addToast, navigate]);

  // Handle adding an item row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        quantity: 1,
        sku: '',
        name: '',
        unitPrice: 0,
        availableStock: 0,
      },
    ]);
  };

  // Handle item product selection changes
  const handleProductChange = (index: number, val: string) => {
    const matchedProduct = products.find((p) => p.id === val);
    if (!matchedProduct) return;

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        productId: val,
        quantity: updated[index].quantity,
        sku: matchedProduct.sku,
        name: matchedProduct.name,
        unitPrice: matchedProduct.unitPrice,
        availableStock: matchedProduct.currentStock,
        error: updated[index].quantity > matchedProduct.currentStock ? 'Exceeds available stock' : undefined,
      };
      return updated;
    });
  };

  // Handle item quantity inputs
  const handleQuantityChange = (index: number, val: number) => {
    if (val < 1) val = 1; // Minimum quantity is 1
    
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: val,
        error: val > item.availableStock ? 'Exceeds available stock' : undefined,
      };
      return updated;
    });
  };

  // Handle removing an item row
  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute live totals
  const totalQuantity = items.reduce((acc, item) => acc + (item.productId ? item.quantity : 0), 0);
  const totalAmount = items.reduce((acc, item) => acc + (item.productId ? item.unitPrice * item.quantity : 0), 0);

  const handleSubmitChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!customerId) {
      addToast('Please select a customer', 'error');
      return;
    }
    if (items.length === 0) {
      addToast('Please add at least one product item row', 'error');
      return;
    }

    // Filter unselected rows
    const selectedItems = items.filter(item => item.productId !== '');
    if (selectedItems.length === 0) {
      addToast('Please select a product for the rows', 'error');
      return;
    }

    // Check stock validations on confirmation submit
    if (status === 'CONFIRMED') {
      const stockErrors = selectedItems.filter(item => item.quantity > item.availableStock);
      if (stockErrors.length > 0) {
        addToast(`Insufficient stock for: ${stockErrors.map(e => e.name).join(', ')}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        status,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/challans', payload);
      if (res.data.success) {
        addToast(`Sales challan booked successfully as ${status}`, 'success');
        navigate(`/challans/${res.data.data.id}`);
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to submit sales challan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/challans')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Create Sales Challan
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">Book items for client dispatch. Drafts preserve stock; Confirmation deducts inventory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields (Left/Top) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2.5">
              Select Client
            </h3>
            
            <div className="w-full">
              <Select
                label="Customer / Business Partner"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={[
                  { label: '-- Select active partner --', value: '' },
                  ...customers.map(c => ({ 
                    label: `${c.customerName} (${c.businessName}) - Type: ${c.customerType}`, 
                    value: c.id 
                  }))
                ]}
              />
              {customerId && (
                <div className="mt-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-850 text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                  <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    Selected billing details will snapshots on the dispatch invoice. Ensure client address and GST registration are correct before confirming.
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Product Items Selector Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <h3 className="text-sm font-bold text-slate-200">
                Dispatch Product Items
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item Row
              </Button>
            </div>

            <div className="space-y-4">
              {items.length === 0 ? (
                <EmptyState 
                  message="No items added yet" 
                  description="Click Add Item Row to select items from your catalog." 
                  icon={<ShoppingBag className="h-8 w-8 text-slate-500" />}
                />
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border bg-slate-950/20 flex flex-col md:flex-row gap-4 items-end transition-all ${
                        item.error ? 'border-red-900/35 bg-red-950/5' : 'border-slate-850'
                      }`}
                    >
                      {/* Product select */}
                      <div className="flex-1 w-full">
                        <Select
                          label={`Item #${idx + 1}`}
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          options={[
                            { label: '-- Select catalog item --', value: '' },
                            ...products.map(p => ({ 
                              label: `${p.name} (SKU: ${p.sku}) [Stock: ${p.currentStock}]`, 
                              value: p.id 
                            }))
                          ]}
                        />
                      </div>

                      {/* Display Product Details Snapshot in Row */}
                      {item.productId && (
                        <>
                          <div className="w-full md:w-28 flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Price</span>
                            <span className="text-sm font-extrabold text-slate-200 px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 text-center">
                              ₹{item.unitPrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="w-full md:w-24 flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">In Stock</span>
                            <span className={`text-sm font-extrabold px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 text-center ${
                              item.availableStock <= 0 ? 'text-red-400' : 'text-slate-350'
                            }`}>
                              {item.availableStock}
                            </span>
                          </div>

                          <div className="w-full md:w-32">
                            <Input
                              label="Quantity"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                              error={item.error}
                            />
                          </div>

                          <div className="w-full md:w-28 flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Total Row</span>
                            <span className="text-sm font-extrabold text-indigo-400 px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 text-center">
                              ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2.5 rounded-lg border border-slate-800 hover:border-red-900/30 text-slate-400 hover:text-red-400 hover:bg-red-950/10 transition-all shrink-0 mt-0 sm:mb-1.5"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Invoice Summary Box (Right/Bottom) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col gap-5 sticky top-6">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2.5 flex items-center justify-between">
              Order Dispatch Summary
              <Badge value="Review" />
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Distinct Items:</span>
                <span className="font-extrabold text-slate-200">{items.filter(i => i.productId !== '').length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Total Quantity:</span>
                <span className="font-extrabold text-slate-200">{totalQuantity} units</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3.5">
                <span className="text-slate-400 font-bold">Total Amount:</span>
                <span className="font-black text-lg text-indigo-400">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Warning block if stock warnings exist */}
            {items.some(item => !!item.error) && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Inventory Over-allocation:</span>
                  One or more items exceed safety stock limits. You can save as a <span className="font-semibold underline">DRAFT</span>, but <span className="font-semibold underline">CONFIRMATION</span> will fail.
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
              <Button
                variant="primary"
                onClick={() => handleSubmitChallan('CONFIRMED')}
                isLoading={submitting}
                disabled={items.length === 0 || items.some(item => !!item.error)}
                className="w-full py-2.5 text-sm font-bold shadow-md shadow-indigo-650/10"
              >
                Confirm & Deduct Inventory
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSubmitChallan('DRAFT')}
                isLoading={submitting}
                disabled={items.length === 0}
                className="w-full py-2.5 text-sm font-semibold"
              >
                Save as Draft
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/challans')}
                className="w-full py-2.5 text-sm"
              >
                Back to Registry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
