import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardHeader } from "@/components/ui/card";
import EditProfilePage from "./pages/UserProfilePage";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Enhanced Header Card */}
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Manage company account settings and set e-mail preferences
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
        <EditProfilePage />
      </div>
    </div>
  );
}
