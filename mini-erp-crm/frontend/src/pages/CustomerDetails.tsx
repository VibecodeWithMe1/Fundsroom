import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight,
  User, 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Hash, 
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Plus,
  Send,
  Briefcase,
  Users,
  AlertTriangle
} from 'lucide-react';

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any | null>(null);
  const [challans, setChallans] = useState<any[]>([]);

  // Add Follow Up states
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [contactMethod, setContactMethod] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'SMS'>('CALL');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [stageHistory, setStageHistory] = useState<any[]>([]);

  const fetchCustomerDetails = async () => {
    try {
      const [custRes, chalRes, histRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/challans?customerId=${id}&limit=50`),
        api.get(`/customers/${id}/stage-history`),
      ]);

      if (custRes.data.success) {
        setCustomer(custRes.data.data);
      }
      if (chalRes.data.success) {
        setChallans(chalRes.data.data.challans);
      }
      if (histRes.data.success) {
        setStageHistory(histRes.data.data);
      }
    } catch (err) {
      addToast('Failed to load customer CRM profile', 'error');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !notes.trim()) {
      addToast('Please enter both a follow-up date and notes', 'error');
      return;
    }

    setFollowUpSubmitting(true);
    try {
      const res = await api.post(`/customers/${id}/follow-ups`, {
        followUpDate: new Date(followUpDate).toISOString(),
        notes,
        contactMethod,
      });

      if (res.data.success) {
        addToast('Follow-up logged successfully', 'success');
        setNotes('');
        setFollowUpDate('');
        setContactMethod('CALL');
        
        // Reload details to update history lists
        fetchCustomerDetails();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to log follow-up notes', 'error');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div className="text-center py-10 text-red-500">Customer not found.</div>;

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  const stages = ['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON'];

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'EMAIL': return <Mail className="h-3.5 w-3.5 text-indigo-400" />;
      case 'MEETING': return <Users className="h-3.5 w-3.5 text-indigo-400" />;
      case 'SMS': return <Send className="h-3.5 w-3.5 text-indigo-400" />;
      default: return <Phone className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  const renderStepper = () => {
    const isLost = customer.leadStage === 'LOST';
    const activeIndex = isLost ? -1 : stages.indexOf(customer.leadStage || 'LEAD');

    return (
      <Card className="col-span-full">
        <h3 className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-2.5 uppercase tracking-wider">
          CRM Lead Conversion Pipeline
        </h3>
        <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          {/* Connector line for large screens */}
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-800 -translate-y-1/2 hidden md:block z-0" />
          
          {isLost ? (
            <div className="w-full flex items-center justify-center p-3.5 rounded-xl border border-red-900/20 bg-red-950/10 text-red-400 gap-2.5 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
              Lead lost / deactivated. Historical logs retained.
            </div>
          ) : (
            stages.map((stage, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-full md:w-auto">
                  <div className={`
                    h-9 w-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300
                    ${isCompleted 
                      ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-500/20 scale-105 border-2 border-indigo-400' 
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }
                    ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : ''}
                  `}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                    isCompleted ? 'text-indigo-400 font-extrabold' : 'text-slate-500'
                  }`}>
                    {stage === 'WON' ? 'WON (ACTIVE)' : stage}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              {customer.customerName}
              <Badge value={customer.status} />
              {customer.leadStage && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{customer.leadStage}</span>}
            </h2>
            <p className="text-sm text-slate-455 mt-0.5">{customer.businessName}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isSalesOrAdmin && (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate(`/customers/${customer.id}/edit`)}
              >
                Edit Profile
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/challans/new?customerId=${customer.id}`)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Book Sales Challan
              </Button>
            </>
          )}
        </div>
      </div>

      {renderStepper()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information (Left/Top) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2.5">
              Client Dossier
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex gap-3">
                <Building className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Business Name</span>
                  <span className="text-slate-200 font-bold">{customer.businessName}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <User className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Primary Contact</span>
                  <span className="text-slate-200 font-medium">{customer.customerName}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Mobile Connection</span>
                  <span className="text-slate-200 font-mono font-medium">{customer.mobileNumber}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Email Inbox</span>
                  <span className="text-slate-200 font-medium truncate max-w-[200px] block">{customer.email}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Hash className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">GST Identification</span>
                  <span className="text-slate-200 font-mono font-medium">
                    {customer.gstNumber || <span className="text-slate-600 font-normal italic">None registered</span>}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Classification Type</span>
                  <Badge value={customer.customerType} className="mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Billing Address</span>
                  <span className="text-slate-300 text-xs mt-0.5 block leading-relaxed">{customer.address}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Follow Ups and Activity (Right/Bottom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CRM Follow up notes scheduler */}
          {isSalesOrAdmin && (
            <Card>
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-indigo-400" />
                Schedule Next Follow-Up Contact
              </h3>
              
              <form onSubmit={handleAddFollowUp} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Call Schedule Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      min={new Date().toISOString().split('T')[0]} // Block yesterday
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact Method / Channel</label>
                    <select
                      value={contactMethod}
                      onChange={(e: any) => setContactMethod(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="EMAIL">Email Thread</option>
                      <option value="MEETING">In-Person Meeting</option>
                      <option value="SMS">SMS / Chat Msg</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Discussion / Activity Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document discounts requested, feedback, lead status notes, bulk order schedules..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={followUpSubmitting}
                    className="px-6"
                  >
                    Log Follow-up Call
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Previous Follow-up History */}
          <Card>
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
              Follow-up Audit Log ({customer.followUps?.length || 0})
            </h3>

            <div className="mt-4 space-y-4">
              {!customer.followUps || customer.followUps.length === 0 ? (
                <EmptyState 
                  message="No follow-up records" 
                  description="Onboard this lead by booking a contact follow-up log." 
                  icon={<Clock className="h-8 w-8 text-slate-500" />}
                />
              ) : (
                <div className="relative border-l-2 border-slate-800 pl-4 ml-2 space-y-5">
                  {customer.followUps.map((log: any) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-indigo-550" />
                      
                      <div className="flex flex-col gap-1 text-slate-350">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5">
                            {getContactIcon(log.contactMethod)}
                            Logged by {log.creator?.name} ({log.creator?.role})
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-350 bg-slate-950/40 p-3 rounded-lg border border-slate-900 mt-1 leading-relaxed">
                          {log.notes}
                        </p>
                        <div className="text-[10px] text-amber-450 font-semibold mt-1">
                          Scheduled next contact: {new Date(log.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Lead Conversion Stage Changes */}
          <Card>
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              Lead Conversion Stage Changes ({stageHistory.length})
            </h3>
            <div className="mt-4 space-y-4">
              {stageHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  No stage change records logged yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 pl-4 ml-2 space-y-5">
                  {stageHistory.map((hist: any) => (
                    <div key={hist.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-purple-500" />
                      
                      <div className="flex flex-col gap-1 text-slate-350">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">
                            Changed by {hist.changer?.name} ({hist.changer?.role})
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {new Date(hist.changedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-500">Pipeline Shifted:</span>
                          <span className="px-2 py-0.5 bg-red-950/20 text-red-400 rounded-md font-bold uppercase border border-red-900/10">{hist.oldStage}</span>
                          <span className="text-slate-600 font-black">→</span>
                          <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 rounded-md font-bold uppercase border border-emerald-900/10">{hist.newStage}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Customer's Invoice History (ERP connection) */}
          <Card>
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-indigo-400" />
              Sales Invoices & Challans ({challans.length})
            </h3>

            <div className="mt-4 overflow-x-auto scrollbar-thin">
              {challans.length === 0 ? (
                <EmptyState 
                  message="No billing invoices" 
                  description="This customer hasn't purchased catalog items yet." 
                />
              ) : (
                <table className="w-full text-left text-xs text-slate-350">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 uppercase">
                      <th className="py-2.5">Challan No</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">Total Quantity</th>
                      <th className="py-2.5 text-right">Invoice Amount</th>
                      <th className="py-2.5 text-right">Date</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {challans.map((chal) => (
                      <tr key={chal.id} className="hover:bg-slate-900/10">
                        <td className="py-3 font-mono font-bold text-indigo-400">{chal.challanNumber}</td>
                        <td className="py-3 text-center">
                          <Badge value={chal.status} />
                        </td>
                        <td className="py-3 text-center font-semibold">{chal.totalQuantity} items</td>
                        <td className="py-3 text-right font-extrabold text-slate-250">
                          ₹{chal.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {new Date(chal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 text-right">
                          <Link 
                            to={`/challans/${chal.id}`}
                            className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Details
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
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
    </div>
  );
};
