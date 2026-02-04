import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const RecordRMInvoice = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Invoice recorded and Stock updated!");
        navigate("/dashboard/raw-materials/invoices");
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard/raw-materials/invoices">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Record Invoice & GRN</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="po">Reference PO Number</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select PO..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="po1">PO-RM-1001 (Textile Corp)</SelectItem>
                                        <SelectItem value="po2">PO-RM-1002 (Thread Masters)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invNumber">Invoice Number (Supplier)</Label>
                                <Input id="invNumber" placeholder="e.g. INV-9988" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Invoice Date</Label>
                                <Input type="date" id="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Total Amount</Label>
                                <Input type="number" id="amount" placeholder="0.00" required />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Upload Invoice Document</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-sm">Click to upload or drag and drop</span>
                                <Input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                {file && <span className="text-blue-600 font-medium mt-2">{file.name}</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                                <Save className="mr-2 h-4 w-4" /> Save & Update Stock
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default RecordRMInvoice;
