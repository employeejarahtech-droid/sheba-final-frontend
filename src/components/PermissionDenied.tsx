import { ShieldAlert } from 'lucide-react'

interface PermissionDeniedProps {
  message?: string
}

export function PermissionDenied({ message = 'You do not have permission to perform this action.' }: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-red-100 dark:bg-red-900/40 p-5 rounded-full border border-red-200 dark:border-red-800 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
        </div>
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Access Denied</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg">
        {message}
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-6 max-w-sm">
        Please contact your system administrator if you believe this is a mistake or if you need access to this module.
      </p>
    </div>
  )
}
