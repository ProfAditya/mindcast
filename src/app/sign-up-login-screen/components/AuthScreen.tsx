'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AppLogo from '@/components/ui/AppLogo';
import { authApi, isAuthenticated } from '@/lib/api';

type AuthTab = 'login' | 'signup';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function PasswordInput({
  register,
  name,
  placeholder,
  error,
  validationRules,
}: {
  register: ReturnType<typeof useForm>['register'];
  name: string;
  placeholder: string;
  error?: string;
  validationRules?: Record<string, unknown>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Lock size={15} strokeWidth={1.5} />
      </div>
      <input
        {...register(name, validationRules)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className={cn('input-field pl-10 pr-10', error && 'border-rose-500')}
        data-testid={`input-${name}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="toggle-password"
      >
        {show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function LoginForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authApi.login(data.email, data.password);
      toast.success('Welcome back to MindCast ✨');
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground" htmlFor="login-email">
          Email address
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Mail size={15} strokeWidth={1.5} />
          </div>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
            id="login-email"
            type="email"
            placeholder="you@example.com"
            className={cn('input-field pl-10', errors.email && 'border-rose-500')}
            data-testid="input-email"
          />
        </div>
        {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground" htmlFor="login-password">
          Password
        </label>
        <PasswordInput
          register={register}
          name="password"
          placeholder="Your password"
          error={errors.password?.message as string | undefined}
          validationRules={{ required: 'Password is required' }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center group"
        data-testid="login-submit"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Sign In
            <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        New to MindCast?{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="text-primary font-semibold hover:underline"
        >
          Create an account
        </button>
      </p>
    </motion.form>
  );
}

function SignupForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    try {
      await authApi.signup(data.name, data.email, data.password);
      toast.success('Account created! Welcome to MindCast ✨');
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground">Full Name</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <User size={15} strokeWidth={1.5} />
          </div>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            placeholder="Your name"
            className={cn('input-field pl-10', errors.name && 'border-rose-500')}
            data-testid="input-name"
          />
        </div>
        {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground">Email address</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Mail size={15} strokeWidth={1.5} />
          </div>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
            type="email"
            placeholder="you@example.com"
            className={cn('input-field pl-10', errors.email && 'border-rose-500')}
            data-testid="input-signup-email"
          />
        </div>
        {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground">Password</label>
        <PasswordInput
          register={register}
          name="password"
          placeholder="At least 8 characters"
          error={errors.password?.message as string | undefined}
          validationRules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium font-heading text-foreground">Confirm Password</label>
        <PasswordInput
          register={register}
          name="confirmPassword"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message as string | undefined}
          validationRules={{
            required: 'Please confirm your password',
            validate: (value: string) => value === password || 'Passwords do not match',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center group"
        data-testid="signup-submit"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Create Account
            <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </button>
      </p>
    </motion.form>
  );
}

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-violet-rose flex items-center justify-center mb-4">
            <AppLogo size={24} />
          </div>
          <h1 className="font-heading font-700 text-2xl text-foreground tracking-tight">MindCast</h1>
          <p className="text-muted-foreground text-sm mt-1">Your personal wellness companion</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card-md">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6">
            {(['login', 'signup'] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold font-heading transition-all duration-200',
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`tab-${tab}`}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <LoginForm key="login" onSwitchTab={() => setActiveTab('signup')} />
            ) : (
              <SignupForm key="signup" onSwitchTab={() => setActiveTab('login')} />
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}