import React, { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
    placeholder?: string;
    value: string[];
    onChange: (tags: string[]) => void;
    className?: string;
}

export function TagInput({
    placeholder = "Type and press Enter...",
    value = [],
    onChange,
    className,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const addTag = () => {
        const trimmedInput = inputValue.trim();
        if (trimmedInput && !value.includes(trimmedInput)) {
            onChange([...value, trimmedInput]);
            setInputValue("");
        }
    };

    const removeTag = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
            {value.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-0.5">
                    {tag}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full hover:bg-transparent hover:text-destructive"
                        onClick={() => removeTag(index)}
                    >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {tag}</span>
                    </Button>
                </Badge>
            ))}
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 min-w-[120px]"
            />
        </div>
    );
}
