import { Link } from '@tanstack/react-router'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 p-6'>
      <div className='w-full max-w-md space-y-6'>
        {/* Logo */}
        <Link
          to='/'
          className='flex flex-col items-center gap-3 text-center w-fit mx-auto'
        >
          <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-2xl shadow-lg'>
            H
          </div>
          <h2 className='text-2xl font-bold'>
            <span className='text-blue-600'>H</span>MS
          </h2>
        </Link>

        {/* Card */}
        <div className='bg-white rounded-2xl border border-slate-200 p-8 shadow-xl ring-1 ring-slate-900/5 space-y-6'>
          {/* Header */}
          <div className='text-center space-y-2'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100'>
              <KeyRound className='h-6 w-6 text-blue-600' />
            </div>
            <h1 className='text-2xl font-bold text-slate-900'>Forgot password?</h1>
            <p className='text-sm text-slate-500'>
              No worries — enter your registered email and we'll send you a code
              to reset your password.
            </p>
          </div>

          {/* Form */}
          <ForgotPasswordForm />

          {/* Back to login */}
          <div className='pt-2 text-center'>
            <Link
              to='/login'
              className='inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className='text-center text-xs text-slate-400'>
          Don't have an account?{' '}
          <Link
            to='/register'
            className='font-medium text-blue-600 hover:text-blue-700'
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
