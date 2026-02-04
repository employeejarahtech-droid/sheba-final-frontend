// /* eslint-disable @typescript-eslint/no-explicit-any */
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import z from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useUpdateSalesOrderStatusMutation } from "@/store/features/salesOrder/salesOrder";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { useEffect } from "react";

// const deliverySchema = z
//     .object({
//         status: z.enum([
//             "pending",
//             "in_transit",
//             "delivered",
//             "failed",
//             "returned",
//             "confirmed",
//         ]),
//         delivery_date: z.string().optional(),
//         notes: z.string().optional(),
//     })
//     .refine(
//         (data) => {
//             const requiredStatuses = [
//                 "pending",
//                 "in_transit",
//                 "delivered",
//                 "failed",
//                 "returned",
//                 "confirmed",
//                 "cancelled",
//             ];
//             if (requiredStatuses.includes(data.status)) {
//                 return !!data.delivery_date;
//             }
//             return true;
//         },
//         {
//             path: ["delivery_date"],
//             message: "Delivery date is required for this status",
//         }
//     );

// type DeliveryFormValues = z.infer<typeof deliverySchema>;

// interface UpdateDeliveryStatusModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     selectedOrder: any;
// }

// export default function UpdateDeliveryStatusModal({
//     isOpen,
//     onClose,
//     selectedOrder,
// }: UpdateDeliveryStatusModalProps) {
//     const form = useForm<DeliveryFormValues>({
//         resolver: zodResolver(deliverySchema),
//         defaultValues: {
//             status: "pending",
//             delivery_date: "",
//             notes: "",
//         },
//     });

//     useEffect(() => {
//         if (selectedOrder) {
//             form.reset({
//                 status: selectedOrder.delivery_status || "pending",
//                 delivery_date: selectedOrder.delivery?.delivery_date
//                     ? new Date(selectedOrder.delivery.delivery_date)
//                         .toISOString()
//                         .split("T")[0]
//                     : "",
//                 notes: selectedOrder.delivery?.notes || "",
//             });
//         }
//     }, [selectedOrder, form]);

//     const [updateOrder] = useUpdateSalesOrderStatusMutation();


//     const handleUpdate = async (values: DeliveryFormValues) => {
//         if (!selectedOrder) return;

//         try {
//             const payload = {
//                 status: values.status,
//                 delivery_date: values.delivery_date || undefined,
//                 notes: values.notes,
//             };

//             await updateOrder({
//                 orderId: selectedOrder.id,
//                 orderData: payload,
//             }).unwrap();

//             toast.success("Order updated successfully!");
//             onClose();
//         } catch (err) {
//             console.error(err);
//             toast.error("Failed to update order.");
//         }
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="sm:max-w-lg">
//                 <DialogHeader>
//                     <DialogTitle>Update Delivery Status</DialogTitle>
//                 </DialogHeader>

//                 <form onSubmit={form.handleSubmit(handleUpdate)}>
//                     <div className="space-y-4 mt-2">
//                         {/* Status */}
//                         <div>
//                             <label className="block font-semibold mb-1">Status</label>
//                             <Select
//                                 // eslint-disable-next-line react-hooks/incompatible-library
//                                 value={form.watch("status")}
//                                 onValueChange={(v) =>
//                                     form.setValue("status", v as DeliveryFormValues["status"])
//                                 }
//                             >
//                                 <SelectTrigger className="w-full">
//                                     <SelectValue placeholder="Select Status" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="pending">Pending</SelectItem>
//                                     <SelectItem value="in_transit">In Transit</SelectItem>
//                                     <SelectItem value="delivered">Delivered</SelectItem>
//                                     <SelectItem value="failed">Failed</SelectItem>
//                                     <SelectItem value="returned">Returned</SelectItem>
//                                     <SelectItem value="confirmed">Confirmed</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         {/* Delivery Date */}
//                         <div>
//                             <label className="block font-semibold mb-1">
//                                 Delivery Date
//                                 {["in_transit", "delivered", "confirmed"].includes(
//                                     form.watch("status")
//                                 ) && <span className="text-red-500 ml-1">*</span>}
//                             </label>

//                             <Input type="date" {...form.register("delivery_date")} />

//                             {form.formState.errors.delivery_date && (
//                                 <p className="text-sm text-red-500 mt-1">
//                                     {form.formState.errors.delivery_date.message}
//                                 </p>
//                             )}
//                         </div>

//                         {/* Notes */}
//                         <div>
//                             <label className="block font-semibold mb-1">Notes</label>
//                             <Textarea {...form.register("notes")} />
//                         </div>
//                     </div>

//                     <DialogFooter className="mt-4 flex justify-end gap-2">
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => onClose()}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="submit"
//                             className="bg-blue-600 hover:bg-blue-700 text-white"
//                             disabled={form.formState.isSubmitting}
//                         >
//                             Update
//                         </Button>
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }




/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useUpdateSalesOrderStatusMutation } from "@/store/features/salesOrder/salesOrder";

/* ---------------- TYPES ---------------- */

// export interface StatusOption {
//     value: string;
//     label: string;
// }

interface UpdateDeliveryStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedOrder: any;
    statusOptions: readonly { value: DeliveryFormValues["status"]; label: string }[];
    defaultStatus?: DeliveryFormValues["status"];
}

/* ---------------- SCHEMA ---------------- */

const deliverySchema = z
    .object({
        status: z.enum([
            "pending",
            "in_transit",
            "delivered",
            "failed",
            "returned",
            "confirmed",
            "cancelled",
        ]),
        delivery_date: z.string().optional(),
        notes: z.string().optional(),
    })
    .refine(
        (data) => {
            const requiredStatuses = [
                "pending",
                "in_transit",
                "delivered",
                "failed",
                "returned",
                "confirmed",
                "cancelled",
            ];
            if (requiredStatuses.includes(data.status)) {
                return !!data.delivery_date;
            }
            return true;
        },
        {
            path: ["delivery_date"],
            message: "Delivery date is required for this status",
        }
    );

type DeliveryFormValues = z.infer<typeof deliverySchema>;

/* ---------------- COMPONENT ---------------- */

export default function UpdateDeliveryStatusModal({
    isOpen,
    onClose,
    selectedOrder,
    statusOptions,
    defaultStatus,
}: UpdateDeliveryStatusModalProps) {
    const form = useForm<DeliveryFormValues>({
        resolver: zodResolver(deliverySchema),
        defaultValues: {
            status: "pending",
            delivery_date: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (selectedOrder) {
            form.reset({
                status: defaultStatus || selectedOrder.delivery_status || "pending",
                delivery_date: selectedOrder.delivery?.delivery_date
                    ? new Date(selectedOrder.delivery.delivery_date)
                        .toISOString()
                        .split("T")[0]
                    : "",
                notes: selectedOrder.delivery?.notes || "",
            });
        }
    }, [selectedOrder, form, defaultStatus]);

    const [updateOrder] = useUpdateSalesOrderStatusMutation();

    const handleUpdate = async (values: DeliveryFormValues) => {
        if (!selectedOrder) return;

        try {
            const payload = {
                status: values.status,
                delivery_date: values.delivery_date || undefined,
                notes: values.notes,
            };

            await updateOrder({
                orderId: selectedOrder.id,
                orderData: payload,
            }).unwrap();

            toast.success("Order updated successfully!");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update order.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Update Delivery Status</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleUpdate)}>
                    <div className="space-y-4 mt-2">
                        {/* Status */}
                        <div>
                            <label className="block font-semibold mb-1">Status</label>
                            <Select
                                value={form.watch("status")}
                                onValueChange={(v) =>
                                    form.setValue("status", v as DeliveryFormValues["status"])
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Delivery Date */}
                        <div>
                            <label className="block font-semibold mb-1">
                                Delivery Date
                                {["in_transit", "delivered", "confirmed"].includes(
                                    form.watch("status")
                                ) && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            <Input type="date" {...form.register("delivery_date")} />

                            {form.formState.errors.delivery_date && (
                                <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.delivery_date.message}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block font-semibold mb-1">Notes</label>
                            <Textarea {...form.register("notes")} />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={form.formState.isSubmitting}
                        >
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
