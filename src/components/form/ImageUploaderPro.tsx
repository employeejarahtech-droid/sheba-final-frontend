"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Check, Upload } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProProps {
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
}

interface MediaItem {
    id: string;
    filename: string;
    path: string;
    base64: string;
}

export default function ImageUploaderPro({
    value = "",
    onChange,
    multiple = false,
}: ImageUploadProProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
    const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const selectedValues = multiple
        ? Array.isArray(value)
            ? value
            : []
        : value
            ? [value as string]
            : [];

    // ---------------- FETCH MEDIA LIBRARY ----------------
    const fetchLibrary = async (pageNum = 1) => {
        try {
            const result = await window.electron.invoke("images:getAll", {
                page: pageNum,
                limit: 12,
            });

            setMediaLibrary(result?.data || []);
            setTotalPages(result?.pagination?.totalPage || 1);
            setPage(result?.pagination?.page || 1);
        } catch (err) {
            console.error("Library fetch error:", err);
            toast.error("Failed to load media library");
        }
    };

    useEffect(() => {
        if (open && activeTab === "library") {
            fetchLibrary(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activeTab, page]);

    // ---------------- CONVERT FILE TO BASE64 ----------------
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // ---------------- HANDLE FILE SELECTION AND UPLOAD ----------------
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const uploadedPaths: string[] = [];

            for (const file of Array.from(files)) {
                // Validate file type
                if (!file.type.startsWith("image/")) {
                    toast.error(`${file.name} is not an image file`);
                    continue;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (max 5MB)`);
                    continue;
                }

                const base64Data = await fileToBase64(file);

                console.log('Uploading file:', file.name, 'Size:', file.size);

                const result = await window.electron.invoke("images:save", {
                    base64Data,
                    filename: file.name,
                });

                console.log('Upload result:', {
                    success: result?.success,
                    hasBase64: !!result?.base64,
                    base64Length: result?.base64?.length
                });

                if (result?.success && result?.base64) {
                    uploadedPaths.push(result.base64);
                } else {
                    console.error('Upload failed for', file.name, result);
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (uploadedPaths.length) {
                if (multiple) {
                    onChange([...(Array.isArray(value) ? value : []), ...uploadedPaths]);
                } else {
                    onChange(uploadedPaths[0]);
                    setOpen(false);
                }
                toast.success(
                    `${uploadedPaths.length} image${uploadedPaths.length > 1 ? "s" : ""} uploaded successfully`
                );

                // Refresh library if on that tab
                if (activeTab === "library") {
                    fetchLibrary(page);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    // ---------------- SELECT / UNSELECT ----------------
    const toggleSelect = (base64Url: string) => {
        if (multiple) {
            if (selectedValues.includes(base64Url)) {
                onChange(selectedValues.filter((v) => v !== base64Url));
            } else {
                onChange([...selectedValues, base64Url]);
            }
        } else {
            onChange(base64Url);
            setOpen(false);
        }
    };

    // ---------------- REMOVE ----------------
    const removeSelected = (base64Url: string) => {
        if (multiple) {
            onChange(selectedValues.filter((v) => v !== base64Url));
        } else {
            onChange("");
        }
    };

    // ---------------- DELETE ----------------
    const deleteImage = async (item: MediaItem) => {
        if (!confirm("Delete this image permanently?")) return;

        try {
            const result = await window.electron.invoke("images:delete", item.path);

            if (result?.success) {
                toast.success("Image deleted");
                setMediaLibrary((prev) => prev.filter((i) => i.id !== item.id));

                // Remove from selected values if it's selected
                if (multiple) {
                    onChange(selectedValues.filter((v) => v !== item.base64));
                } else if (value === item.base64) {
                    onChange("");
                }
            } else {
                toast.error("Failed to delete image");
            }
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    return (
        <div>
            {/* Selected Images */}
            <div className="flex flex-wrap gap-3 mb-3">
                {selectedValues.map((url, index) => (
                    <div key={`${url.substring(0, 50)}-${index}`} className="relative w-28 h-28 group">
                        <img
                            src={url}
                            alt="Selected"
                            className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                            onClick={() => !multiple && setOpen(true)}
                            onError={(e) => {
                                console.error('Failed to load selected image');
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        <button
                            onClick={() => removeSelected(url)}
                            className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            type="button"
                        >
                            <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 hover:text-red-600" />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {(multiple || selectedValues.length === 0) && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <div className="w-28 h-28 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all">
                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Add Image</span>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Select Images</DialogTitle>
                            </DialogHeader>

                            <Tabs
                                value={activeTab}
                                onValueChange={(v) => setActiveTab(v as "upload" | "library")}
                            >
                                <TabsList className="mb-4 grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">Upload</TabsTrigger>
                                    <TabsTrigger value="library">Media Library</TabsTrigger>
                                </TabsList>

                                {/* UPLOAD */}
                                <TabsContent value="upload">
                                    <div
                                        onClick={() => inputRef.current?.click()}
                                        className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all"
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Click to select {multiple ? "images" : "image"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    PNG, JPG, GIF, WEBP (max 5MB)
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={inputRef}
                                            multiple={multiple}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                </TabsContent>

                                {/* MEDIA LIBRARY */}
                                <TabsContent value="library">
                                    {mediaLibrary.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <p>No images in library yet</p>
                                            <p className="text-sm mt-1">Upload some images to get started</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                                                {mediaLibrary.map((item) => {
                                                    const isSelected = selectedValues.includes(item.base64);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected
                                                                ? "ring-2 ring-blue-500 border-blue-500"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                                                }`}
                                                        >
                                                            <img
                                                                src={item.base64}
                                                                alt={item.filename}
                                                                className="w-full h-24 object-cover"
                                                                onClick={() => toggleSelect(item.base64)}
                                                                onError={(e) => {
                                                                    console.error('Failed to load image:', item.filename);
                                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                                                                }}
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full shadow-md">
                                                                    <Check size={14} />
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteImage(item);
                                                                }}
                                                                className="absolute bottom-1 right-1 bg-red-600 hover:bg-red-700 p-1 text-white rounded-full shadow-md transition-colors"
                                                                type="button"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={page <= 1}
                                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                        type="button"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Page {page} of {totalPages}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={page >= totalPages}
                                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                        type="button"
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>

                            <div className="mt-4 flex justify-end">
                                <DialogClose asChild>
                                    <Button variant="ghost" type="button">
                                        Close
                                    </Button>
                                </DialogClose>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
