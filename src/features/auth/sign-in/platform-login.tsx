import { useState } from 'react'
import { cn } from '@/lib/utils'
import { UserAuthForm } from './components/user-auth-form'
import { Shield, Building2, Database, Users, Globe, Lock } from 'lucide-react'

export function PlatformLogin() {
  const [companyName] = useState<string>('HMS Platform')
  const firstLetter = companyName.charAt(0).toUpperCase()

  return (
    <div className='min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Left Side - Platform Branding */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        {/* Animated background pattern */}
        <div className='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=")] opacity-30' />

        {/* Gradient overlays */}
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20' />
        <div className='absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent' />

        <div className='relative z-10 flex flex-col items-center justify-center w-full px-12 text-white'>
          <div className='max-w-lg text-center space-y-8'>
            {/* Logo */}
            <div className='flex items-center justify-center gap-4'>
              <div className='h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-2xl'>
                <Shield className='h-10 w-10 text-white' />
              </div>
            </div>

            {/* Title */}
            <div className='space-y-3'>
              <h2 className='text-4xl font-bold tracking-tight'>
                HMS Platform
              </h2>
              <p className='text-lg text-purple-200'>
                Enterprise Hospital Management System
              </p>
            </div>

            {/* Features */}
            <div className='space-y-4 pt-4'>
              <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'>
                <div className='h-12 w-12 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0'>
                  <Building2 className='h-6 w-6 text-blue-300' />
                </div>
                <div className='text-left'>
                  <h3 className='font-semibold text-white'>Multi-Tenant Architecture</h3>
                  <p className='text-sm text-purple-200'>Manage multiple hospitals from one platform</p>
                </div>
              </div>

              <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'>
                <div className='h-12 w-12 rounded-xl bg-purple-500/30 flex items-center justify-center shrink-0'>
                  <Database className='h-6 w-6 text-purple-300' />
                </div>
                <div className='text-left'>
                  <h3 className='font-semibold text-white'>Centralized Database</h3>
                  <p className='text-sm text-purple-200'>Secure and scalable data management</p>
                </div>
              </div>

              <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'>
                <div className='h-12 w-12 rounded-xl bg-pink-500/30 flex items-center justify-center shrink-0'>
                  <Users className='h-6 w-6 text-pink-300' />
                </div>
                <div className='text-left'>
                  <h3 className='font-semibold text-white'>Role-Based Access</h3>
                  <p className='text-sm text-purple-200'>Granular permissions for every user</p>
                </div>
              </div>

              <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'>
                <div className='h-12 w-12 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0'>
                  <Globe className='h-6 w-6 text-indigo-300' />
                </div>
                <div className='text-left'>
                  <h3 className='font-semibold text-white'>Subdomain Support</h3>
                  <p className='text-sm text-purple-200'>Custom domains for each hospital</p>
                </div>
              </div>
            </div>

            {/* Security badge */}
            <div className='flex items-center justify-center gap-2 pt-6'>
              <Lock className='h-4 w-4 text-green-400' />
              <span className='text-sm text-green-400 font-medium'>Enterprise-Grade Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-6 lg:p-12'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile Logo */}
          <div className='flex lg:hidden flex-col items-center gap-4 text-center mb-8'>
            <div className='h-16 w-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg'>
              <Shield className='h-8 w-8 text-white' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-white'>HMS Platform</h2>
              <p className='text-sm text-purple-200'>Enterprise Hospital Management</p>
            </div>
          </div>

          {/* Login Card */}
          <div className='bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl'>
            <div className='space-y-6'>
              {/* Header */}
              <div className='text-center space-y-2'>
                <div className='hidden lg:flex h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center mx-auto shadow-lg'>
                  <span className='text-white font-bold text-xl'>{firstLetter}</span>
                </div>
                <h1 className='text-2xl font-bold text-white'>Platform Login</h1>
                <p className='text-sm text-purple-200'>
                  Sign in to access the HMS platform
                </p>
              </div>

              {/* Form */}
              <UserAuthForm />

              {/* Additional Links */}
              <div className='pt-4 border-t border-white/10 space-y-3'>
                <a
                  href='https://shebahms.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block text-center text-sm text-purple-200 hover:text-white transition-colors'
                >
                  Learn about HMS Platform →
                </a>
                <div className='text-center text-xs text-purple-300'>
                  Platform administrators: Use your platform credentials
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='text-center text-xs text-purple-300'>
            <p>© 2024 HMS Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
