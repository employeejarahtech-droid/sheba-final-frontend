"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface ImageUploadProProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

interface MediaItem {
  id: number;
  url: string;
}

export default function ImageUploaderPro({
  value = "",
  onChange,
  multiple = false,
}: ImageUploadProProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const token = Cookies.get("token");
  const API_URL = import.meta.env.VITE_API_URL;

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
      const res = await fetch(
        `${API_URL}/api/upload/images?page=${pageNum}&limit=12`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      setMediaLibrary(data?.data || []);

      const totalPage = parseInt(data?.pagination?.totalPage || "1", 10);
      setTotalPages(totalPage);

      const currentPage = parseInt(data?.pagination?.page || "1", 10);
      setPage(currentPage);
    } catch (err) {
      console.error("Library fetch error:", err);
    }
  };

  useEffect(() => {
    if (open) fetchLibrary(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  // ---------------- HANDLE FILE SELECTION AND UPLOAD ----------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_URL}/api/upload/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data?.data?.url) {
          uploadedUrls.push(`${API_URL}${data.data.url}`);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedUrls.length) {
        if (multiple) {
          onChange([...(Array.isArray(value) ? value : []), ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0]);
          setOpen(false);
        }
        fetchLibrary(page);
        toast.success("Image(s) uploaded successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- SELECT / UNSELECT ----------------
  const toggleSelect = (url: string) => {
    if (multiple) {
      if (selectedValues.includes(url)) {
        onChange(selectedValues.filter((v) => v !== url));
      } else {
        onChange([...selectedValues, url]);
      }
    } else {
      onChange(url);
      setOpen(false);
    }
  };

  // ---------------- REMOVE ----------------
  const removeSelected = (url: string) => {
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== url));
    } else {
      onChange("");
    }
  };

  // ---------------- DELETE ----------------
  const deleteImage = async (url: string) => {
    const filename = url.split("/").pop();
    if (!filename) return;
    if (!confirm("Delete this image permanently?")) return;

    try {
      await fetch(`${API_URL}/api/upload/images/${filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Image deleted");
      setMediaLibrary((prev) =>
        prev.filter((i) => `${API_URL}${i.url}` !== url)
      );

      if (multiple) {
        onChange(selectedValues.filter((v) => v !== url));
      } else if (value === url) {
        onChange("");
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
        {selectedValues.map((url) => (
          <div key={url} className="relative w-28 h-28">
            <img
              src={url}
              className="w-full h-full object-cover rounded-xl border"
              onClick={() => !multiple && setOpen(true)}
            />
            <button
              onClick={() => removeSelected(url)}
              className="absolute -top-2 -right-2 bg-white p-1 rounded-full border shadow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Button */}
        {(multiple || selectedValues.length === 0) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <div className="w-28 h-28 border border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-100">
                +
              </div>
            </DialogTrigger>
            <DialogTitle className="hidden sr-only">Select Images</DialogTitle>
            <DialogContent className="sm:max-w-[800px]">
              <h2 className="text-lg font-semibold mb-4">Select Images</h2>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab as (v: string) => void}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="library">Media Library</TabsTrigger>
                </TabsList>

                {/* UPLOAD */}
                <TabsContent value="upload">
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="w-full h-40 border border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-100"
                  >
                    {uploading
                      ? "Uploading..."
                      : `Click to select ${multiple ? "images" : "image"}`}
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
                  <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                    {mediaLibrary.map((item) => {
                      const fullUrl = `${API_URL}${item.url}`;
                      const isSelected = selectedValues.includes(fullUrl);
                      return (
                        <div
                          key={item.id}
                          className={`relative border rounded-xl overflow-hidden cursor-pointer ${isSelected ? "ring-2 ring-blue-500" : ""
                            }`}
                        >
                          <img
                            src={fullUrl}
                            className="w-full h-24 object-cover"
                            onClick={() => toggleSelect(fullUrl)}
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                          <button
                            onClick={() => deleteImage(fullUrl)}
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
        )}
      </div>
    </div>
  );
}
