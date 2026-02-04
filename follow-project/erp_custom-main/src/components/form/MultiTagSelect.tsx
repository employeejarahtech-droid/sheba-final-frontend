import { useState } from "react";
import { X } from "lucide-react";

interface MultiTagSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export default function MultiTagSelect({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter...",
}: MultiTagSelectProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddValue = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();

      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  return (
    <div className="w-full">
      {label && <label className="block font-medium mb-1">{label}</label>}

      <div className="border rounded-md p-2 flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="hover:text-red-300"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          className="flex-grow outline-none px-1"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddValue}
        />
      </div>
    </div>
  );
}
