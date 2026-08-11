import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Building, 
  MapPin, 
  Mail, 
  Phone,
  User,
  ShieldAlert,
  ArrowDownLeft
} from 'lucide-react';

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [challan, setChallan] = useState<any | null>(null);

  // Transaction confirmations
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchChallan = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err) {
      addToast('Failed to load sales challan invoice details', 'error');
      navigate('/challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirmChallan = async () => {
    setConfirmLoading(true);
    try {
      const res = await api.post(`/challans/${id}/confirm`);
      if (res.data.success) {
        addToast('Challan confirmed. Product inventory stock deducted.', 'success');
        setConfirmOpen(false);
        fetchChallan(); // Reload
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to confirm challan', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelChallan = async () => {
    setCancelLoading(true);
    try {
      const res = await api.post(`/challans/${id}/cancel`);
      if (res.data.success) {
        addToast('Challan cancelled. Restored allocated product stocks.', 'success');
        setCancelOpen(false);
        fetchChallan(); // Reload
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to cancel challan', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner />;
  if (!challan) return <div className="text-center py-10 text-red-500">Challan not found.</div>;

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header - Hidden in Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/challans')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              Challan Invoice Details
              <Badge value={challan.status} />
            </h2>
            <p className="text-sm text-slate-400 mt-1">Unique dispatch serial: {challan.challanNumber}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            onClick={triggerPrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4.5 w-4.5" />
            Print / Save PDF
          </Button>

          {challan.status === 'DRAFT' && isSalesOrAdmin && (
            <Button
              variant="success"
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              Confirm Challan
            </Button>
          )}

          {challan.status !== 'CANCELLED' && isAdmin && (
            <Button
              variant="danger"
              onClick={() => setCancelOpen(true)}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4.5 w-4.5" />
              Cancel Challan
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document Box */}
      <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Print Brand Header - Visible only in Print */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider text-black uppercase">
              Operations Portal ERP
            </h1>
            <p className="text-xs text-slate-500 font-medium">Sales challan and logistics receipt</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-extrabold text-black">CHALLAN RECEIPT</h2>
            <p className="text-xs text-slate-500 font-bold font-mono">{challan.challanNumber}</p>
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-800 pb-6 mb-6 print:border-slate-350">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 print:text-slate-500">
              Billing & Delivery Client
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-extrabold text-slate-200 print:text-black flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-500 shrink-0 print:hidden" />
                {challan.customer?.businessName}
              </p>
              <p className="font-medium text-slate-400 print:text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500 shrink-0 print:hidden" />
                {challan.customer?.customerName}
              </p>
              <p className="text-slate-450 print:text-slate-650 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5 print:hidden" />
                <span className="leading-relaxed">{challan.customer?.address}</span>
              </p>
              <p className="font-mono text-xs text-slate-450 print:text-slate-650 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500 shrink-0 print:hidden" />
                {challan.customer?.mobileNumber}
              </p>
              {challan.customer?.gstNumber && (
                <p className="font-mono text-xs text-slate-400 print:text-slate-850 mt-1 flex items-center gap-2">
                  <span className="font-bold print:text-slate-500 uppercase print:hidden">GST:</span>
                  {challan.customer?.gstNumber}
                </p>
              )}
            </div>
          </div>

          <div className="md:text-right space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block print:text-slate-500">
                Challan ID
              </span>
              <span className="font-mono font-bold text-slate-200 text-lg print:text-black block mt-0.5">
                {challan.challanNumber}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block print:text-slate-500">
                Created Timestamp
              </span>
              <span className="text-sm font-semibold text-slate-350 print:text-slate-700 block mt-0.5">
                {new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block print:text-slate-500">
                Authorized By
              </span>
              <span className="text-sm font-semibold text-slate-350 print:text-slate-700 block mt-0.5">
                {challan.creator?.name} ({challan.creator?.role})
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Item Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm print:text-black">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-450 tracking-wider print:border-slate-900 print:text-slate-600">
                <th className="py-3">No.</th>
                <th className="py-3">Product Name (Snapshot)</th>
                <th className="py-3">SKU Snapshot</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-center">Qty Booked</th>
                <th className="py-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 print:divide-slate-300">
              {challan.challanItems?.map((item: any, idx: number) => (
                <tr key={item.id} className="hover:bg-slate-900/10 print:hover:bg-transparent">
                  <td className="py-4 text-slate-500 font-semibold">{idx + 1}</td>
                  <td className="py-4 font-bold text-slate-200 print:text-black">{item.productNameSnapshot}</td>
                  <td className="py-4 font-mono font-medium text-slate-400 print:text-slate-700">{item.skuSnapshot}</td>
                  <td className="py-4 text-right font-semibold text-slate-350 print:text-slate-700">
                    ₹{item.unitPriceSnapshot.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 text-center font-extrabold text-slate-200 print:text-black">{item.quantity}</td>
                  <td className="py-4 text-right font-extrabold text-indigo-400 print:text-black">
                    ₹{item.totalPrice.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals Footer */}
        <div className="border-t border-slate-800 mt-6 pt-6 flex justify-end print:border-slate-900">
          <div className="w-full sm:w-80 space-y-3.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold print:text-slate-500">Distinct Items:</span>
              <span className="font-bold text-slate-200 print:text-black">{challan.challanItems?.length} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold print:text-slate-500">Total Quantity:</span>
              <span className="font-bold text-slate-200 print:text-black">{challan.totalQuantity} units</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-3.5 print:border-slate-500">
              <span className="text-slate-350 font-bold print:text-black">Invoice Total:</span>
              <span className="font-black text-xl text-indigo-400 print:text-black">
                ₹{challan.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Print Disclaimer - Visible only in Print */}
        <div className="hidden print:block mt-16 text-center text-[10px] text-slate-400 border-t border-slate-300 pt-5">
          This is a computer-generated challan document. No physical signature is required.
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmChallan}
        title="Confirm Sales Challan"
        message="Are you sure you want to confirm this sales challan? This operation runs a database transaction that validates and decreases stock levels immediately. This cannot be undone by sales users."
        confirmText="Confirm Dispatch"
        isLoading={confirmLoading}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelChallan}
        title="Cancel Sales Challan"
        message="Are you sure you want to cancel this challan? This will change status to CANCELLED and restore the previously allocated stock levels back to inventory."
        confirmText="Cancel Invoice"
        isDanger={true}
        isLoading={cancelLoading}
      />
    </div>
  );
};
