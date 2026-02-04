
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface BackButtonProps {
  fallbackUrl?: string; // Where to go if no history
  text?: string;        // Button label
}

export function BackButton({
  fallbackUrl = "/",
  text = "Back",
  ...props
}: BackButtonProps) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = fallbackUrl;
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleBack}
      className="flex items-center gap-2"
      {...props}
    >
      <ArrowLeft className="w-4 h-4" />
      {text}
    </Button>
  );
}
