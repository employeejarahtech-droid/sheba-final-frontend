"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Upload,
    ImageIcon,
    Trash2,
    Loader2,
    Check,
    Search,
    ChevronLeft,
    ChevronRight,
    Link2,
    X,
    Folder,
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from '@/lib/cookies';
import { cn } from "@/lib/utils";

interface GalleryImage {
    id: number;
    filename: string;
    original_name: string;
    url: string;
    size: number;
    mimetype: string;
    created_at: string;
    folder: string;
}

interface GallerySelectorProps {
    onImageSelect: (imageUrl: string) => void;
    currentImage?: string;
    triggerLabel?: string;
    triggerClassName?: string;
    accept?: string;
    maxSize?: number; // in bytes
    aspectRatio?: 'square' | 'landscape' | 'portrait' | 'any';
    defaultFolder?: string; // pre-selects this folder (Library filter + Upload destination) when the modal opens
}

export function GallerySelector({
    onImageSelect,
    currentImage,
    triggerLabel = "Select from Gallery",
    triggerClassName = "",
    accept = "image/*",
    maxSize = 5 * 1024 * 1024, // 5MB default
    aspectRatio = 'any',
    defaultFolder
}: GallerySelectorProps) {
    const token = getCookie('accessToken');
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [urlValue, setUrlValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [folders, setFolders] = useState<string[]>(['General']);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = All, in the Library tab
    const [uploadFolder, setUploadFolder] = useState('General'); // destination folder for the Upload tab
    const imagesPerPage = 12;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch gallery images + folders when dialog opens
    useEffect(() => {
        if (open) {
            fetchImages();
            fetchFolders();
            if (defaultFolder) {
                setSelectedFolder(defaultFolder);
                setUploadFolder(defaultFolder);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Helper to ensure URLs are full API URLs
    const ensureFullUrl = (url: string) => {
        if (!url) return url;
        // Already a full URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Relative URL - prepend API base URL
        const apiUrl = import.meta.env.VITE_API_URL || '';
        return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Reset transient state on close
    useEffect(() => {
        if (!open) {
            setSelectedImage(null);
            setSearchQuery('');
            setUrlValue('');
            setCurrentPage(1);
            setSelectedFolder(null);
            setUploadFolder('General');
        }
    }, [open]);

    // Reset to first page whenever the search or folder filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedFolder]);

    // Filtering the Library tab to a folder sets that as the Upload tab's
    // destination too, so switching tabs stays in the same folder context.
    useEffect(() => {
        if (selectedFolder) setUploadFolder(selectedFolder);
    }, [selectedFolder]);

    const fetchImages = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const json = await res.json();
                // Ensure all image URLs are full URLs
                const imagesWithFullUrls = (json.data || []).map((img: GalleryImage) => ({
                    ...img,
                    url: ensureFullUrl(img.url)
                }));
                setImages(imagesWithFullUrls);
            } else {
                throw new Error('Failed to fetch gallery images');
            }
        } catch (error) {
            console.error('Failed to fetch gallery images:', error);
            toast.error('Failed to load gallery images');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFolders = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setFolders(json.data && json.data.length > 0 ? json.data : ['General']);
            }
        } catch (error) {
            console.error('Failed to fetch gallery folders:', error);
        }
    };

    const uploadFile = async (file: File) => {
        if (file.size > maxSize) {
            toast.error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', uploadFolder || 'General');

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const json = await res.json();
                const uploadedImage = {
                    ...json.data,
                    url: ensureFullUrl(json.data.url)
                };
                setImages(prev => [uploadedImage, ...prev]);
                setSelectedImage(uploadedImage);
                fetchFolders();
                toast.success('Image uploaded successfully!');
            } else {
                throw new Error('Failed to upload image');
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await uploadFile(file);
    };

    const handleDelete = async (id: number, filename: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const displayName = filename || 'this image';
        if (!confirm(`Delete "${displayName}"?`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setImages(prev => prev.filter(img => img.id !== id));
                if (selectedImage?.id === id) setSelectedImage(null);
                toast.success('Image deleted');
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    const handleSelect = (image: GalleryImage) => {
        setSelectedImage(image);
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onImageSelect(selectedImage.url);
            setOpen(false);
            toast.success('Image selected');
        }
    };

    const handleUrlConfirm = () => {
        const url = urlValue.trim();
        if (!url) return;
        onImageSelect(url);
        setOpen(false);
        toast.success('Image URL selected');
    };

    const filteredImages = images.filter(img =>
        (selectedFolder ? img.folder === selectedFolder : true) &&
        ((img.original_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (img.filename?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
    );

    // Pagination
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const currentImages = filteredImages.slice(startIndex, endIndex);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getThumbnailClass = () => {
        switch (aspectRatio) {
            case 'square': return 'aspect-square';
            case 'landscape': return 'aspect-video';
            case 'portrait': return 'aspect-[3/4]';
            default: return 'aspect-video';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={triggerClassName}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[1200px] sm:max-w-[1200px] h-[85vh] max-h-[900px] gap-0 p-0 overflow-hidden flex flex-col shadow-2xl rounded-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b px-6 py-4 sm:px-8 sm:py-5">
                    <DialogTitle className="text-center text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Image Gallery
                    </DialogTitle>
                    <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
                        Choose an image from your library or upload a new one
                    </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="gallery" className="flex flex-1 flex-col gap-0 overflow-hidden">
                    <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-white dark:bg-gray-950 p-0">
                        <TabsTrigger
                            value="gallery"
                            className="flex-1 gap-2.5 rounded-none border-0 border-b-2 border-transparent bg-transparent py-4 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                        >
                            <ImageIcon className="h-4 w-4" />
                            Image Library
                        </TabsTrigger>
                        <TabsTrigger
                            value="upload"
                            className="flex-1 gap-2.5 rounded-none border-0 border-b-2 border-transparent bg-transparent py-4 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Image
                        </TabsTrigger>
                    </TabsList>

                    {/* Gallery Tab */}
                    <TabsContent value="gallery" className="m-0 flex flex-1 flex-col overflow-hidden p-0 bg-white dark:bg-gray-950">
                        {/* Search */}
                        <div className="px-8 py-5 border-b">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search images by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-9 h-11 text-sm border-gray-200 dark:border-gray-800"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Folder filter chips */}
                            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFolder(null)}
                                    className={cn(
                                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                                        selectedFolder === null
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "border-gray-200 dark:border-gray-800 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-900"
                                    )}
                                >
                                    All
                                </button>
                                {folders.map((folder) => (
                                    <button
                                        type="button"
                                        key={folder}
                                        onClick={() => setSelectedFolder(folder)}
                                        className={cn(
                                            "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                                            selectedFolder === folder
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-gray-200 dark:border-gray-800 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-900"
                                        )}
                                    >
                                        <Folder className="h-3 w-3" />
                                        {folder}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Images Grid */}
                        <ScrollArea className="flex-1 px-8 bg-gray-50 dark:bg-gray-900/50">
                            {isLoading ? (
                                <div className="flex h-64 items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
                                        <p className="text-sm font-medium text-muted-foreground">Loading gallery...</p>
                                    </div>
                                </div>
                            ) : currentImages.length === 0 ? (
                                <div className="flex h-64 flex-col items-center justify-center text-center">
                                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
                                        <ImageIcon className="h-9 w-9 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">No images found</h3>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        {searchQuery
                                            ? `No results match "${searchQuery}". Try a different search term.`
                                            : selectedFolder
                                                ? `No images in "${selectedFolder}" yet.`
                                                : 'Your image library is empty. Upload an image to get started.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex justify-center py-4 sm:py-6 px-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4 w-full max-w-full">
                                        {currentImages.map((image) => {
                                            const isSelected = selectedImage?.id === image.id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={image.id}
                                                    onClick={() => handleSelect(image)}
                                                    className={cn(
                                                        "group relative aspect-square overflow-hidden rounded-lg border-2 text-left transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 w-full",
                                                        isSelected
                                                            ? "border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500 ring-offset-2"
                                                            : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg"
                                                    )}
                                                >
                                                    <div className="relative bg-white dark:bg-gray-900 w-full h-full">
                                                        <img
                                                            src={image.url}
                                                            alt={image.original_name || image.filename || 'Gallery image'}
                                                            loading="lazy"
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />

                                                        {/* Selected indicator overlay */}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                                                <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                                                    <Check className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Gradient overlay for text */}
                                                        {!isSelected && (
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                                        )}

                                                        {/* Delete button */}
                                                        <span
                                                            role="button"
                                                            tabIndex={-1}
                                                            onClick={(e) => handleDelete(image.id, image.original_name || image.filename || 'image', e)}
                                                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-red-600 group-hover:opacity-100 shadow-lg z-10"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </span>

                                                        {/* Image info (on hover) */}
                                                        {!isSelected && (
                                                            <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                                <p className="truncate text-xs font-semibold drop-shadow-lg">
                                                                    {image.original_name || image.filename || 'Untitled'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Pagination footer — always visible once there's at least one image */}
                        {filteredImages.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 border-t px-4 sm:px-6 py-3 bg-white dark:bg-gray-950">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages || 1} · {imagesPerPage} per page
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="icon"
                                                    className={`h-8 w-8 sm:h-9 sm:w-9 ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
                                                    onClick={() => setCurrentPage(page)}
                                                    aria-label={`Go to page ${page}`}
                                                    aria-current={currentPage === page ? 'page' : undefined}
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 sm:gap-4 border-t bg-white dark:bg-gray-950 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3 flex-1">
                                {selectedImage ? (
                                    <>
                                        <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-sm">
                                            <img src={selectedImage.url} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {selectedImage.original_name || selectedImage.filename || 'Untitled'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(selectedImage.size)}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" aria-hidden="true"></span>
                                        Select an image to continue
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    size="sm"
                                    className="min-w-[80px] sm:min-w-[100px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!selectedImage}
                                    size="sm"
                                    className="min-w-[100px] sm:min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                                    aria-label="Add selected image"
                                >
                                    <Check className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Add Image</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Upload Tab */}
                    <TabsContent value="upload" className="m-0 flex-1 overflow-auto p-8 bg-white dark:bg-gray-950">
                        <div className="mx-auto max-w-2xl space-y-8">
                            {/* Destination folder */}
                            <div>
                                <Label htmlFor="gallery-upload-folder" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                    <Folder className="h-4 w-4 text-blue-600" />
                                    Upload to folder
                                </Label>
                                <Input
                                    id="gallery-upload-folder"
                                    list="gallery-folder-options"
                                    value={uploadFolder}
                                    onChange={(e) => setUploadFolder(e.target.value)}
                                    placeholder="General"
                                    className="h-11 border-gray-300 dark:border-gray-700"
                                />
                                <datalist id="gallery-folder-options">
                                    {folders.map((folder) => (
                                        <option key={folder} value={folder} />
                                    ))}
                                </datalist>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Pick an existing folder or type a new name — it's created the moment you upload into it.
                                </p>
                            </div>

                            {/* Dropzone */}
                            <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                onDrop={handleDrop}
                                className={cn(
                                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300",
                                    isDragging
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]"
                                        : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-900/50",
                                    isUploading && "pointer-events-none opacity-60"
                                )}
                            >
                                <div className={cn(
                                    "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                                    isDragging
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-600 dark:text-blue-400"
                                )}>
                                    {isUploading
                                        ? <Loader2 className="h-7 w-7 animate-spin" />
                                        : <Upload className="h-7 w-7" />}
                                </div>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {isUploading ? 'Uploading your image...' : 'Drop your image here'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    or <span className="font-medium text-blue-600 dark:text-blue-400">click to browse</span> and select a file
                                </p>
                                <p className="mt-4 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-full">
                                    Maximum {Math.round(maxSize / 1024 / 1024)}MB · JPG, PNG, GIF, SVG, WebP
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={accept}
                                    onChange={handleUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                            </div>

                            {/* Selected image preview */}
                            {selectedImage && (
                                <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 shadow-sm">
                                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                                        Selected Image Preview
                                    </Label>
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-md">
                                            <img
                                                src={selectedImage.url}
                                                alt={selectedImage.original_name || selectedImage.filename || 'Gallery image'}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                {selectedImage.original_name || selectedImage.filename || 'Untitled'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{formatFileSize(selectedImage.size)}</p>
                                        </div>
                                        <Button
                                            onClick={handleConfirm}
                                            size="default"
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 min-w-[120px]"
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Use This Image
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* URL input */}
                            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Link2 className="h-4 w-4 text-blue-600" />
                                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Or use an image URL
                                    </Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input
                                        placeholder="https://example.com/image.png"
                                        value={urlValue}
                                        onChange={(e) => setUrlValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleUrlConfirm(); }}
                                        className="flex-1 h-11 border-gray-300 dark:border-gray-700"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={handleUrlConfirm}
                                        disabled={!urlValue.trim()}
                                        className="min-w-[100px]"
                                    >
                                        Use URL
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
