import { Link } from '@tanstack/react-router'
import { Building2, Database, Users, Globe, Lock, ShieldCheck } from 'lucide-react'
import { UserAuthForm } from './components/user-auth-form'

const features = [
  {
    icon: Building2,
    title: 'Multi-Tenant Architecture',
    description: 'Manage multiple hospitals from one platform',
  },
  {
    icon: Database,
    title: 'Centralized Database',
    description: 'Secure and scalable data management',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Granular permissions for every user',
  },
  {
    icon: Globe,
    title: 'Subdomain Support',
    description: 'Custom domains for each hospital',
  },
]

export function PlatformLogin() {
  return (
    <div className='min-h-screen flex bg-slate-50'>
      {/* Left Side - Platform Branding */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-sky-700'>
        {/* Background decoration */}
        <div className='absolute inset-0 opacity-40'>
          <div className='absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-400 rounded-full blur-3xl mix-blend-overlay' />
          <div className='absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400 rounded-full blur-3xl mix-blend-overlay' />
        </div>

        <div className='relative z-10 flex flex-col items-center justify-center w-full px-12 text-white'>
          <div className='max-w-lg text-center space-y-8'>
            {/* Logo */}
            <Link to='/' className='flex items-center justify-center gap-3'>
              <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-white text-blue-600 font-bold text-2xl shadow-lg'>
                H
              </div>
              <span className='text-3xl font-bold tracking-tight'>HMS</span>
            </Link>

            {/* Title */}
            <div className='space-y-3'>
              <h2 className='text-4xl font-bold tracking-tight'>
                Hospital Management Platform
              </h2>
              <p className='text-lg text-blue-100'>
                Next-generation healthcare, absolute data security
              </p>
            </div>

            {/* Features */}
            <div className='space-y-4 pt-4'>
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'
                >
                  <div className='h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0'>
                    <Icon className='h-6 w-6 text-white' />
                  </div>
                  <div className='text-left'>
                    <h3 className='font-semibold text-white'>{title}</h3>
                    <p className='text-sm text-blue-100'>{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Security badge */}
            <div className='flex items-center justify-center gap-2 pt-6'>
              <ShieldCheck className='h-4 w-4 text-emerald-300' />
              <span className='text-sm text-emerald-200 font-medium'>
                Enterprise-Grade Security
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-6 lg:p-12'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile Logo */}
          <Link to='/' className='flex lg:hidden flex-col items-center gap-3 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-2xl shadow-lg'>
              H
            </div>
            <div>
              <h2 className='text-2xl font-bold'>
                <span className='text-blue-600'>H</span>MS
              </h2>
              <p className='text-sm text-slate-500'>Hospital Management Platform</p>
            </div>
          </Link>

          {/* Login Card */}
          <div className='bg-white rounded-2xl border border-slate-200 p-8 shadow-xl ring-1 ring-slate-900/5'>
            <div className='space-y-6'>
              {/* Header */}
              <div className='text-center space-y-2'>
                <div className='hidden lg:flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center mx-auto shadow-lg shadow-blue-200'>
                  <Lock className='h-6 w-6 text-white' />
                </div>
                <h1 className='text-2xl font-bold text-slate-900'>Platform Login</h1>
                <p className='text-sm text-slate-500'>
                  Sign in to access the HMS platform
                </p>
              </div>

              {/* Form */}
              <UserAuthForm />

              {/* Additional Links */}
              <div className='pt-4 border-t border-slate-100 space-y-4'>
                <p className='text-center text-sm text-slate-600'>
                  Don't have an account?{' '}
                  <Link
                    to='/register'
                    className='text-blue-600 hover:text-blue-700 font-semibold transition-colors'
                  >
                    Sign up
                  </Link>
                </p>
                <Link
                  to='/about'
                  className='block text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors'
                >
                  Learn about HMS →
                </Link>
                <div className='text-center text-xs text-slate-400'>
                  Platform administrators: Use your platform credentials
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='text-center text-xs text-slate-400'>
            <p>© {new Date().getFullYear()} HMS. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
