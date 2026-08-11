import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      addToast('Welcome to the Operations Portal!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      addToast(err || 'Invalid credentials. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-650/15 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-650/10 rounded-full filter blur-[80px]" />

      <div className="w-full max-w-md z-10">
        {/* Brand logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-lg shadow-indigo-950/40">
            <Lock className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            MINI ERP + CRM PORTAL
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Operations Portal authentication desk
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl shadow-slate-950/60 border border-slate-800">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="admin@example.com"
              leftIcon={<Mail className="h-4.5 w-4.5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4.5 w-4.5" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 text-sm font-semibold tracking-wide"
              isLoading={loading}
            >
              Sign In to Terminal
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};
