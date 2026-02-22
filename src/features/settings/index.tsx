import { useState } from 'react'
import { UserCog, Type } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsProfile } from './profile'
//import { SettingsNotifications } from './notifications'
//import { SettingsDisplay } from './display'
import { SettingsPrefix } from './prefix'

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <>
      {/* ===== Top Heading ===== */}
      <AppHeader fixed />

      <Main className="p-6 lg:p-10 w-full flex-1 bg-gray-50/50 dark:bg-black/20">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Tabs with Left Sidebar */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Sidebar Tabs */}
              <TabsList className="flex flex-col h-fit w-full lg:w-64 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-2">
                <TabsTrigger
                  value="profile"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <UserCog className="h-5 w-5" />
                  <span className="font-semibold">Profile</span>
                </TabsTrigger>
                {/* <TabsTrigger
                  value="notifications"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <Bell className="h-5 w-5" />
                  <span className="font-semibold">Notifications</span>
                </TabsTrigger> */}
                {/* <TabsTrigger
                  value="display"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <Monitor className="h-5 w-5" />
                  <span className="font-semibold">Display</span>
                </TabsTrigger> */}
                <TabsTrigger
                  value="prefix"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <Type className="h-5 w-5" />
                  <span className="font-semibold">Prefix</span>
                </TabsTrigger>
              </TabsList>

              {/* Right Content Area */}
              <div className="flex-1">
                <TabsContent value="profile" className="m-0">
                  <SettingsProfile />
                </TabsContent>
                {/* <TabsContent value="notifications" className="m-0">
                  <SettingsNotifications />
                </TabsContent> */}
                {/* <TabsContent value="display" className="m-0">
                  <SettingsDisplay />
                </TabsContent> */}
                <TabsContent value="prefix" className="m-0">
                  <SettingsPrefix />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
