import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Clock, Package, User } from "lucide-react";
import { Link, useParams } from "react-router";

const ProductionDetails = () => {
    const { id } = useParams();

    // Mock data
    const batch = {
        id: id || "B-205",
        productName: "Men's Cotton T-Shirt",
        sku: "TS-M-001",
        quantity: 500,
        completedQty: 350,
        startDate: "2024-03-10",
        dueDate: "2024-03-15",
        status: "In Progress",
        supervisor: "Ali Hasan",
        line: "Line A",
        notes: "Priority order for Summer collection launch.",
        materials: [
            { name: "Cotton Fabric", required: "1000 Meters", allocated: "Full" },
            { name: "Polyester Thread", required: "50 Spools", allocated: "Full" },
            { name: "Buttons", required: "500 Pcs", allocated: "Partial" },
        ],
        timeline: [
            { status: "Planned", date: "2024-03-08", completed: true },
            { status: "Materials Allocated", date: "2024-03-09", completed: true },
            { status: "In Production", date: "2024-03-10", completed: true },
            { status: "QA Check", date: "Pending", completed: false },
            { status: "Completed", date: "Pending", completed: false },
        ]
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/production/list">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Batch #{batch.id}
                        <Badge className="bg-blue-600">{batch.status}</Badge>
                    </h1>
                    <p className="text-gray-500">Production Details & Progress</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><Package className="w-4 h-4" /> Product</label>
                                <div className="font-semibold">{batch.productName}</div>
                                <div className="text-xs text-gray-400">{batch.sku}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><User className="w-4 h-4" /> Supervisor</label>
                                <div className="font-semibold">{batch.supervisor}</div>
                                <div className="text-xs text-gray-400">{batch.line}</div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Timeline</label>
                                <div><span className="text-gray-600">Start:</span> {batch.startDate}</div>
                                <div><span className="text-gray-600">Due:</span> {batch.dueDate}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500">Progress</label>
                                <div className="text-2xl font-bold text-blue-600">{batch.completedQty} / {batch.quantity}</div>
                                <div className="text-xs text-gray-400">Units Completed</div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-2">Material Status</h3>
                            <div className="space-y-2">
                                {batch.materials.map((mat, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                                        <span className="font-medium">{mat.name}</span>
                                        <div className="text-right">
                                            <div className="text-sm">{mat.required}</div>
                                            <Badge variant={mat.allocated === "Full" ? "default" : "secondary"} className={mat.allocated === "Full" ? "bg-green-600" : "bg-orange-500"}>
                                                {mat.allocated}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline / Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Production Flow</CardTitle>
                        <CardDescription>Current stage: {batch.status}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4">
                            {batch.timeline.map((step, idx) => (
                                <div key={idx} className="ml-6 relative">
                                    <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}>
                                        {step.completed && <CheckCircle className="h-4 w-4 text-white" />}
                                    </span>
                                    <h3 className={`text-sm font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>{step.status}</h3>
                                    <time className="block mb-2 text-xs font-normal leading-none text-gray-400">{step.date}</time>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-4">Update Status</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProductionDetails;
