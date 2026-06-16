import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Hospital,
} from 'lucide-react';

import { usePlatformAuthStore } from '@/stores/platform-auth-store';
import { getCookie } from '@/lib/cookies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/(platform)/admin/login')({
  beforeLoad: () => {
    const token = getCookie('adminAccessToken');
    if (token) {
      throw redirect({ to: '/admin' });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = usePlatformAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || 'Login failed');
        return;
      }

      const { user, token } = result.data;
      setAuth(user, token);
      toast.success('Login successful');
      navigate({ to: '/admin' });
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left half - Darker purple gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="max-w-md text-center">
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Platform Admin</h2>
            <p className="text-lg text-purple-200 mb-8">
              Manage companies, plans, subscriptions, and platform-wide settings
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Shield className="h-5 w-5 text-purple-200 shrink-0" />
                <span className="text-sm text-purple-100">Full platform control</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Lock className="h-5 w-5 text-purple-200 shrink-0" />
                <span className="text-sm text-purple-100">Secure admin access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right half - Admin login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            {/* Mobile-only logo */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-700 flex items-center justify-center lg:hidden">
                <Hospital className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold lg:hidden"> HMS</h2>
            </div>

            <Badge variant="secondary" className="mb-4 bg-purple-50 text-purple-700 border-purple-200">
              Admin Panel
            </Badge>
            <h3 className="text-xl font-semibold text-gray-900">Admin Login</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to access the platform administration panel
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@shebahms.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                  size="lg"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-purple-600"
            >
              Back to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
