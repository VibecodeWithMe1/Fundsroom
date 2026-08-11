import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Package, Hash, Tag, DollarSign, Archive, MapPin, AlertTriangle } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.string().min(2, 'Category name must be at least 2 characters'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  minimumStock: z.number().int().nonnegative('Minimum stock level cannot be negative').default(0),
  warehouseLocation: z.string().min(2, 'Warehouse location must be at least 2 characters'),
});

type ProductFields = z.infer<typeof productSchema>;

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { addToast } = useToast();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFields>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      currentStock: 0,
      minimumStock: 0,
      unitPrice: 0,
    }
  });

  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        try {
          const res = await api.get(`/products/${id}`);
          if (res.data.success) {
            const p = res.data.data;
            setValue('name', p.name);
            setValue('sku', p.sku);
            setValue('category', p.category);
            setValue('unitPrice', p.unitPrice);
            setValue('currentStock', p.currentStock);
            setValue('minimumStock', p.minimumStock);
            setValue('warehouseLocation', p.warehouseLocation);
          }
        } catch (err) {
          addToast('Failed to load product details', 'error');
          navigate('/products');
        } finally {
          setPageLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit, setValue, navigate, addToast]);

  const onSubmit = async (data: ProductFields) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, data);
        addToast('Product details updated successfully', 'success');
      } else {
        await api.post('/products', data);
        addToast('Product added to catalog successfully', 'success');
      }
      navigate('/products');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save product details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

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
          <h2 className="text-2xl font-extrabold text-white">
            {isEdit ? 'Edit Product Catalog' : 'Add New Product'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isEdit ? 'Update properties for SKU: ' + id : 'Publish a new item into the inventory catalogue'}
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="relative">
              <Input
                label="Product Name"
                placeholder="e.g. Mechanical Gaming Keyboard"
                error={errors.name?.message}
                className="pl-10"
                {...register('name')}
              />
              <Package className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* SKU */}
            <div className="relative">
              <Input
                label="Unique SKU Code"
                placeholder="e.g. KBD-MECH-RGB"
                error={errors.sku?.message}
                disabled={isEdit} // SKU shouldn't be edited easily
                className="pl-10 disabled:opacity-40"
                {...register('sku')}
              />
              <Hash className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Category */}
            <div className="relative">
              <Input
                label="Product Category"
                placeholder="e.g. Electronics, Office Supplies"
                error={errors.category?.message}
                className="pl-10"
                {...register('category')}
              />
              <Tag className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Unit Price */}
            <div className="relative">
              <Input
                label="Unit Price (INR)"
                type="number"
                step="0.01"
                placeholder="e.g. 2450.00"
                error={errors.unitPrice?.message}
                className="pl-10"
                {...register('unitPrice', { valueAsNumber: true })}
              />
              <DollarSign className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Current Stock */}
            <div className="relative">
              <Input
                label={isEdit ? "Current Stock (Informative only)" : "Initial Stock Intake"}
                type="number"
                placeholder="e.g. 50"
                disabled={isEdit} // Stock updates in Edit must go through Stock movements/Adjust
                error={errors.currentStock?.message}
                className="pl-10 disabled:opacity-40"
                {...register('currentStock', { valueAsNumber: true })}
              />
              <Archive className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Minimum Stock */}
            <div className="relative">
              <Input
                label="Minimum Stock (Safety Alert level)"
                type="number"
                placeholder="e.g. 10"
                error={errors.minimumStock?.message}
                className="pl-10"
                {...register('minimumStock', { valueAsNumber: true })}
              />
              <AlertTriangle className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Warehouse location */}
            <div className="relative">
              <Input
                label="Warehouse Storage Shelf Location"
                placeholder="e.g. Shelf A-3, Palette C-12"
                error={errors.warehouseLocation?.message}
                className="pl-10"
                {...register('warehouseLocation')}
              />
              <MapPin className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              className="px-6"
            >
              {isEdit ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
