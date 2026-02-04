import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface EditStockFormProps {
    productId: number;
    open: boolean;
    setOpen: (open: boolean) => void;
    refetchStockMovements: () => void;
}

export default function EditStockForm({ productId, open, setOpen }: EditStockFormProps) {
    const [quantity, setQuantity] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(`Updating stock for product ${productId} by ${quantity}`);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Adjustment</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>
                    <Button type="submit">Update Stock</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
