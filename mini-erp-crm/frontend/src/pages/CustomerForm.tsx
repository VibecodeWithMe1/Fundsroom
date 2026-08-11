import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, User, Building, MapPin, Mail, Phone, Hash } from 'lucide-react';

const customerSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number too long'),
  email: z.string().email('Enter a valid email address'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().optional().nullable().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  leadStage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
});

type CustomerFields = z.infer<typeof customerSchema>;

export const CustomerForm: React.FC = () => {
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
  } = useForm<CustomerFields>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'LEAD',
      leadStage: 'LEAD',
      customerType: 'RETAIL',
      gstNumber: '',
    }
  });

  useEffect(() => {
    if (isEdit) {
      const loadCustomer = async () => {
        try {
          const res = await api.get(`/customers/${id}`);
          if (res.data.success) {
            const c = res.data.data;
            setValue('customerName', c.customerName);
            setValue('mobileNumber', c.mobileNumber);
            setValue('email', c.email);
            setValue('businessName', c.businessName);
            setValue('gstNumber', c.gstNumber || '');
            setValue('customerType', c.customerType);
            setValue('address', c.address);
            setValue('status', c.status);
            setValue('leadStage', c.leadStage || 'LEAD');
          }
        } catch (err) {
          addToast('Failed to load customer profile details', 'error');
          navigate('/customers');
        } finally {
          setPageLoading(false);
        }
      };
      loadCustomer();
    }
  }, [id, isEdit, setValue, navigate, addToast]);

  const onSubmit = async (data: CustomerFields) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, data);
        addToast('Customer profile updated successfully', 'success');
      } else {
        await api.post('/customers', data);
        addToast('Customer registered successfully', 'success');
      }
      navigate('/customers');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save customer details', 'error');
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
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {isEdit ? 'Edit Customer Profile' : 'Register New Customer'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isEdit ? 'Update details for ' + id : 'Onboard a new lead into the CRM system'}
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div className="relative">
              <Input
                label="Customer Name"
                placeholder="e.g. Rahul Sharma"
                error={errors.customerName?.message}
                className="pl-10"
                {...register('customerName')}
              />
              <User className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Business Name */}
            <div className="relative">
              <Input
                label="Business Name"
                placeholder="e.g. Sharma Traders & Co."
                error={errors.businessName?.message}
                className="pl-10"
                {...register('businessName')}
              />
              <Building className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Mobile Number */}
            <div className="relative">
              <Input
                label="Mobile Number"
                placeholder="e.g. 9876543210"
                error={errors.mobileNumber?.message}
                className="pl-10"
                {...register('mobileNumber')}
              />
              <Phone className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Email Address */}
            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. contact@business.com"
                error={errors.email?.message}
                className="pl-10"
                {...register('email')}
              />
              <Mail className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* GST Number */}
            <div className="relative">
              <Input
                label="GST Number (Optional)"
                placeholder="e.g. 07AAAAA1111A1Z1"
                error={errors.gstNumber?.message}
                className="pl-10"
                {...register('gstNumber')}
              />
              <Hash className="absolute left-3 bottom-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            {/* Customer Type */}
            <Select
              label="Customer Type"
              options={[
                { label: 'Retail Client', value: 'RETAIL' },
                { label: 'Wholesale Client', value: 'WHOLESALE' },
                { label: 'Distributor Agency', value: 'DISTRIBUTOR' },
              ]}
              error={errors.customerType?.message}
              {...register('customerType')}
            />

            {/* Lead Status */}
            <Select
              label="CRM Lead Status"
              options={[
                { label: 'Lead Inquiry', value: 'LEAD' },
                { label: 'Active Partner', value: 'ACTIVE' },
                { label: 'Inactive Partner', value: 'INACTIVE' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />

            {/* CRM Lead Conversion Stage */}
            <Select
              label="CRM Lead Stage"
              options={[
                { label: 'New Lead', value: 'LEAD' },
                { label: 'Contacted', value: 'CONTACTED' },
                { label: 'Proposal Sent', value: 'PROPOSAL' },
                { label: 'Negotiation', value: 'NEGOTIATION' },
                { label: 'Won (Active Partner)', value: 'WON' },
                { label: 'Lost (Deactivated Lead)', value: 'LOST' },
              ]}
              error={errors.leadStage?.message}
              {...register('leadStage')}
            />
          </div>

          {/* Billing/Shipping Address */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Billing / Delivery Address</label>
            <div className="relative mt-1">
              <textarea
                placeholder="Enter complete billing address detail..."
                rows={3}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${
                  errors.address ? 'border-red-500 focus:border-red-500' : ''
                }`}
                {...register('address')}
              />
              <MapPin className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
            </div>
            {errors.address && (
              <span className="text-xs text-red-500 font-medium mt-1 block">{errors.address.message}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              className="px-6"
            >
              {isEdit ? 'Save Changes' : 'Onboard Partner'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
