import React, { useMemo, useRef } from "react";
import { X } from "lucide-react";

interface ImageUploaderProps {
  value?: File | null;
  onChange: (file: File | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Preview is derived from `value`
  const previewURL = useMemo(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      return url;
    }
    return null;
  }, [value]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const removeImage = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {previewURL ? (
        <div className="relative w-36 h-36">
          <img
            src={previewURL}
            alt="Preview"
            className="w-36 h-36 object-cover rounded-xl border shadow-sm"
          />

          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      ) : (
        <label
          onClick={() => inputRef.current?.click()}
          className="w-36 h-36 border border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition"
        >
          <div className="text-sm">Upload Image</div>
          <div className="text-xs text-gray-400">PNG / JPG</div>
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
