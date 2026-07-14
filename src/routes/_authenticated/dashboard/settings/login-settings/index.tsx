"use client";

import { useState } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Image as ImageIcon, FileText, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from '@/lib/cookies';
import { AppHeader } from '@/components/layout/app-header'
import { GallerySelector } from '@/components/gallery-selector'

export const Route = createFileRoute('/_authenticated/dashboard/settings/login-settings/')({
    component: LoginSettingsPage,
})

interface LoginSettings {
    logo?: string;
    bgImage?: string;
    informationText?: string;
}

function LoginSettingsPage() {
    const token = getCookie('accessToken');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<LoginSettings>({
        logo: '',
        bgImage: '',
        informationText: '',
    });

    // Fetch current settings
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/login-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setSettings(json.data || {});
            }
        } catch (error) {
            console.error('Failed to fetch login settings:', error);
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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/login-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success('Login settings saved successfully!');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast.error('Failed to save login settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/login-settings/upload-logo`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const json = await res.json();
                setSettings(prev => ({ ...prev, logo: json.data?.logo || '' }));
                toast.success('Logo uploaded successfully!');
            }
        } catch (error) {
            toast.error('Failed to upload logo');
        }
    };

    const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('bgImage', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/login-settings/upload-bg-image`, {
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
            <AppHeader fixed />
            <main className=''>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="mx-auto px-4 space-y-5">

                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                                        Login Page Settings
                                    </h1>
                                    <p className='text-muted-foreground text-sm mt-1'>
                                        Configure the login page appearance with logo, background image, and information text for subdomain logins
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Logo Settings Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <ImageIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Login Page Logo</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Company or organization logo for login page
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {settings.logo && (
                                        <div>
                                            <Label className="text-sm font-semibold">Current Logo</Label>
                                            <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                                <img
                                                    src={settings.logo}
                                                    alt="Login Logo"
                                                    className="h-20 max-w-xs object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-sm font-semibold">Select from Gallery</Label>
                                        <div className="mt-2">
                                            <GallerySelector
                                                onImageSelect={(url) => setSettings({ ...settings, logo: url })}
                                                currentImage={settings.logo}
                                                triggerLabel="Select Logo from Gallery"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                                maxSize={2 * 1024 * 1024}
                                                aspectRatio="landscape"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Choose a logo from the uploaded gallery images
                                        </p>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                            <Label className="text-sm font-medium">Alternative Options</Label>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="logo-upload" className="text-xs">Upload New Logo</Label>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Input
                                                        id="logo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        className="flex-1 text-sm"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Max size 2MB • PNG, JPG, SVG
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="logo-url" className="text-xs">Or enter Logo URL</Label>
                                                <Input
                                                    id="logo-url"
                                                    placeholder="https://example.com/logo.png"
                                                    value={settings.logo || ''}
                                                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                                                    className="mt-2 text-sm"
                                                />
                                            </div>
                                        </div>
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
                                            Login page background wallpaper
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
                                                    alt="Login Background"
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
                                                    placeholder="https://example.com/bg-image.jpg"
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

                        {/* Information Text Card */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <FileText className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Information Text</CardTitle>
                                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                            Custom message for subdomain login pages
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="info-text" className="text-sm font-semibold">Information Text for Subdomain Login</Label>
                                        <Textarea
                                            id="info-text"
                                            placeholder="Enter information text that will be displayed on the login page for subdomain users..."
                                            value={settings.informationText || ''}
                                            onChange={(e) => setSettings({ ...settings, informationText: e.target.value })}
                                            rows={6}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            This text will be shown to users accessing the login page via subdomain (e.g., hospital.example.com)
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Preview:</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                                            {settings.informationText || 'No information text set yet...'}
                                        </p>
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
            </main>
        </>
    );
}
