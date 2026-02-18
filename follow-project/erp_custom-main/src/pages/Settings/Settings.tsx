import { Settings as SettingsIcon } from 'lucide-react';
import EditProfilePage from "./pages/UserProfilePage";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="z-50 h-16 header-fixed peer/header sticky top-0 w-[inherit] shadow">
        <div className="relative flex h-full items-center gap-3 p-4 sm:gap-4 after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage company account settings and set e-mail preferences
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col space-y-2 md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
        <EditProfilePage />
      </div>
    </div>
  );
}
