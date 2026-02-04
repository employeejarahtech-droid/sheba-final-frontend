import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BackButtonProps {
    to?: string;
}

export function BackButton({ to }: BackButtonProps) {
    const navigate = useNavigate();
    return (
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: to || '..' })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
        </Button>
    );
}

export default BackButton;
