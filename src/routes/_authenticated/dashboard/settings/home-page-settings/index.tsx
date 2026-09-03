"use client";

import { useState } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Image as ImageIcon, Home, Save, Loader2, LayoutDashboard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from '@/lib/cookies';
import { GallerySelector } from '@/components/gallery-selector'

export const Route = createFileRoute('/_authenticated/dashboard/settings/home-page-settings/')({
    component: HomePageSettingsPage,
})

interface HomePageSettings {
    bannerTitle?: string;
    bannerSubtitle?: string;
    welcomeMessage?: string;
    showStatsCards?: boolean;
    showQuickActions?: boolean;
    bgImage?: string;
}

function HomePageSettingsPage() {
    const token = getCookie('accessToken');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<HomePageSettings>({
        bannerTitle: '',
        bannerSubtitle: '',
        welcomeMessage: '',
        showStatsCards: true,
        showQuickActions: true,
        bgImage: '',
    });

    // Fetch current settings
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/home-page-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setSettings(json.data || {});
            }
        } catch (error) {
            console.error('Failed to fetch home page settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch settings on mount
    useState(() => {
        fetchSettings();
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/home-page-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success('Home page settings saved successfully!');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast.error('Failed to save home page settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('bgImage', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/home-page-settings/upload-bg-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const json = await res.json();
                setSettings(prev => ({ ...prev, bgImage: json.data?.bgImage || '' }));
                toast.success('Background image uploaded successfully!');
            }
        } catch (error) {
            toast.error('Failed to upload background image');
        }
    };

    return (
        <>
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                                Home Page Settings
                            </h1>
                            <p className='text-muted-foreground text-sm mt-1'>
                                Customize the dashboard home page with banner, welcome message, and layout options
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="mx-auto px-4 space-y-5">
                        {/* Banner Settings Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <LayoutDashboard className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Banner Settings</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Main banner title and subtitle
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="banner-title" className="text-sm font-semibold">Banner Title</Label>
                                        <Input
                                            id="banner-title"
                                            placeholder="Welcome to Hospital Management System"
                                            value={settings.bannerTitle || ''}
                                            onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="banner-subtitle" className="text-sm font-semibold">Banner Subtitle</Label>
                                        <Input
                                            id="banner-subtitle"
                                            placeholder="Your complete healthcare solution"
                                            value={settings.bannerSubtitle || ''}
                                            onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Welcome Message Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Home className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Welcome Message</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Personalized greeting for dashboard users
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="welcome-message" className="text-sm font-semibold">Welcome Message Text</Label>
                                        <Textarea
                                            id="welcome-message"
                                            placeholder="Enter a personalized welcome message for your dashboard users..."
                                            value={settings.welcomeMessage || ''}
                                            onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                                            rows={4}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            This message appears at the top of the dashboard for authenticated users
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Preview:</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            {settings.welcomeMessage || 'No welcome message set yet...'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Layout Options Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <LayoutDashboard className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Layout Options</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Customize home page components and widgets
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <Label htmlFor="show-stats" className="text-sm font-medium">Show Statistics Cards</Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Display key statistics and metrics on home page
                                            </p>
                                        </div>
                                        <Switch
                                            id="show-stats"
                                            checked={settings.showStatsCards}
                                            onCheckedChange={(checked) => setSettings({ ...settings, showStatsCards: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <Label htmlFor="show-quick-actions" className="text-sm font-medium">Show Quick Actions</Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Display quick action buttons for common tasks
                                            </p>
                                        </div>
                                        <Switch
                                            id="show-quick-actions"
                                            checked={settings.showQuickActions}
                                            onCheckedChange={(checked) => setSettings({ ...settings, showQuickActions: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Background Image Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <ImageIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Background Image</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Dashboard home page background wallpaper
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {settings.bgImage && (
                                        <div>
                                            <Label className="text-sm font-semibold">Current Background</Label>
                                            <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                                <img
                                                    src={settings.bgImage}
                                                    alt="Home Page Background"
                                                    className="w-full h-48 object-cover rounded"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-sm font-semibold">Select from Gallery</Label>
                                        <div className="mt-2">
                                            <GallerySelector
                                                onImageSelect={(url) => setSettings({ ...settings, bgImage: url })}
                                                currentImage={settings.bgImage}
                                                triggerLabel="Select Background from Gallery"
                                                accept="image/jpeg,image/png,image/jpg"
                                                maxSize={5 * 1024 * 1024}
                                                aspectRatio="landscape"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Choose a background from the uploaded gallery images
                                        </p>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                            <Label className="text-sm font-medium">Alternative Options</Label>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="bg-upload" className="text-xs">Upload New Background</Label>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Input
                                                        id="bg-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleBgImageUpload}
                                                        className="flex-1 text-sm"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Max size 5MB • JPG, PNG (1920x1080px recommended)
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="bg-url" className="text-xs">Or enter Background Image URL</Label>
                                                <Input
                                                    id="bg-url"
                                                    placeholder="https://example.com/home-bg.jpg"
                                                    value={settings.bgImage || ''}
                                                    onChange={(e) => setSettings({ ...settings, bgImage: e.target.value })}
                                                    className="mt-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex items-center justify-end gap-3 pb-10">
                            <Button
                                variant="outline"
                                size="lg"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[150px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
        </>
    );
}
