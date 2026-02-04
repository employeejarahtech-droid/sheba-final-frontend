"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface ImageGalleryUploaderProProps {
  value?: string[]; // selected image URLs
  onChange: (urls: string[]) => void;
}

interface MediaItem {
  id: number;
  url: string;
}

export default function ImageGalleryUploaderPro({
  value = [],
  onChange,
}: ImageGalleryUploaderProProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const token = Cookies.get("token");

  /* ---------------- FETCH MEDIA LIBRARY ---------------- */
  const fetchLibrary = async (pageNum = 1) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/images?page=${pageNum}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      setMediaLibrary(data?.data || []);
      setTotalPages(Math.ceil(data.total / limit));
    } catch (err) {
      console.error("Library fetch error:", err);
    }
  };

  useEffect(() => {
    if (open) fetchLibrary(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  /* ---------------- MULTI UPLOAD ---------------- */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file); // backend must accept multiple files
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/images`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json(); // { urls: [] }

      if (data?.urls?.length) {
        toast.success("Images uploaded successfully");

        onChange([...value, ...data.urls]);
        fetchLibrary(page);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- SELECT / UNSELECT IMAGE ---------------- */
  const toggleSelect = (url: string) => {
    if (value.includes(url)) {
      onChange(value.filter((u) => u !== url));
    } else {
      onChange([...value, url]);
    }
  };

  /* ---------------- REMOVE SELECTED IMAGE ---------------- */
  const removeSelected = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  /* ---------------- DELETE FROM LIBRARY ---------------- */
  const deleteImage = async (url: string) => {
    const filename = url.split("/").pop();
    if (!filename) return;

    if (!confirm("Delete this image permanently?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/images/${filename}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Image deleted");

      // remove from library + selected
      setMediaLibrary((prev) => prev.filter((i) => i.url !== url));
      onChange(value.filter((u) => u !== url));
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  return (
    <div>
      {/* Selected Images Preview */}
      <div className="flex flex-wrap gap-3 mb-3">
        {value.map((url) => (
          <div key={url} className="relative w-28 h-28">
            <img
              src={`${import.meta.env.VITE_API_URL}${url}`}
              className="w-full h-full object-cover rounded-xl border"
            />
            <button
              type="button"
              onClick={() => removeSelected(url)}
              className="absolute -top-2 -right-2 bg-white p-1 rounded-full border shadow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="w-28 h-28 border border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-100">
              +
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">
              Select Images for Gallery
            </h2>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab as (v: string) => void}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="library">Media Library</TabsTrigger>
              </TabsList>

              {/* UPLOAD TAB */}
              <TabsContent value="upload">
                <div
                  onClick={() => inputRef.current?.click()}
                  className="w-full h-40 border border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-100"
                >
                  {uploading ? "Uploading..." : "Click to upload multiple files"}

                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </TabsContent>

              {/* MEDIA LIBRARY TAB */}
              <TabsContent value="library">
                <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                  {mediaLibrary.map((item) => {
                    const fullUrl = `${import.meta.env.VITE_API_URL}${item.url}`;
                    const isSelected = value.includes(item.url);

                    return (
                      <div
                        key={item.id}
                        className={`relative border rounded-xl overflow-hidden cursor-pointer ${
                          isSelected ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <img
                          src={fullUrl}
                          className="w-full h-24 object-cover"
                          onClick={() => toggleSelect(item.url)}
                        />

                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full">
                            <Check size={12} />
                          </div>
                        )}

                        <button
                          onClick={() => deleteImage(item.url)}
                          className="absolute bottom-1 right-1 bg-red-600 p-1 text-white rounded-full"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex justify-between mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  <span>
                    Page {page} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-end">
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
