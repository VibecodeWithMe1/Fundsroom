import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { EmptyState } from '../components/UI/EmptyState';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserCog, ShieldAlert, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.literal('')),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

type UserFormFields = z.infer<typeof userFormSchema>;

export const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // User Form Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Dialog state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormFields>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: 'SALES',
      password: '',
    }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      addToast('Failed to load user directories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    reset({
      name: '',
      email: '',
      password: '',
      role: 'SALES',
    });
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    reset({
      name: user.name,
      email: user.email,
      password: '', // Leave password empty for edit unless they change it
      role: user.role,
    });
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: UserFormFields) => {
    setFormSubmitting(true);
    try {
      if (editingUserId) {
        // Edit flow
        const updatePayload: any = { ...data };
        if (!data.password) {
          delete updatePayload.password; // Do not update password if empty
        }
        const res = await api.put(`/users/${editingUserId}`, updatePayload);
        if (res.data.success) {
          addToast('User settings updated successfully', 'success');
          fetchUsers();
          setIsModalOpen(false);
        }
      } else {
        // Create flow
        if (!data.password) {
          addToast('Password is required for new users', 'error');
          setFormSubmitting(false);
          return;
        }
        const res = await api.post('/users', data);
        if (res.data.success) {
          addToast('User enrolled successfully', 'success');
          fetchUsers();
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save user configuration', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    if (deleteUserId === currentUser?.id) {
      addToast('Cannot delete your own logged-in administrator session', 'error');
      setDeleteUserId(null);
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await api.delete(`/users/${deleteUserId}`);
      if (res.data.success) {
        addToast('User deleted successfully', 'success');
        setUsers(prev => prev.filter(u => u.id !== deleteUserId));
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete user account', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            User Operations Control
            <UserCog className="h-5 w-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">Provision login access, update employee roles, and audit permissions</p>
        </div>
        
        <Button 
          variant="primary" 
          onClick={openCreateModal}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Provision User
        </Button>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState 
          message="No active users logged" 
          description="Provision a new backend operations user." 
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Staff Name', 'Login Email', 'Assigned Role', 'Enrollment Date', 'Actions']}>
            {users.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-900/20">
                <td className="px-4 py-4 font-bold text-slate-200">{staff.name}</td>
                <td className="px-4 py-4 font-mono text-slate-350 text-xs">{staff.email}</td>
                <td className="px-4 py-4">
                  <Badge value={staff.role} />
                </td>
                <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                  {new Date(staff.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(staff)}
                      title="Update Role/Profile"
                      className="p-1.5 rounded bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-900/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {staff.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeleteUserId(staff.id)}
                        title="Revoke User Session"
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
        </Card>
      )}

      {/* Enroll/Edit Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Edit User Configuration' : 'Provision User Account'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Employee Name"
            placeholder="e.g. Sarah Jenkins"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="System Login Email"
            type="email"
            placeholder="e.g. sarah@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={editingUserId ? "Update Password (Leave blank to keep current)" : "Secret Password"}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Select
            label="Assigned Operational Role"
            options={[
              { label: 'Administrator (Full System)', value: 'ADMIN' },
              { label: 'Sales Representative (CRM/Challans)', value: 'SALES' },
              { label: 'Warehouse Dispatcher (Inventory)', value: 'WAREHOUSE' },
              { label: 'Accountant (Financial Registry)', value: 'ACCOUNTS' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={formSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formSubmitting}
            >
              {editingUserId ? 'Save Changes' : 'Provision Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDelete}
        title="Revoke Employee Portal Access"
        message="Are you sure you want to delete this employee user profile? They will immediately lose login access to the Operations Portal. This action is logged."
        confirmText="Revoke Profile"
        isDanger={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};
