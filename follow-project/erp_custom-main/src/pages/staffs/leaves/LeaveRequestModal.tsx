import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
//import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useStaffWiseFullDayLeaveApplicationMutation } from "@/store/features/attendence/attendenceApiService";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LeaveRequestModal({
  modalOpen,
  setModalOpen,
  staffId,
}: {
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  staffId: number;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reason, setReason] = useState("");

  const [fullDayLeaveRequest] = useStaffWiseFullDayLeaveApplicationMutation();

  const handleFullDayLeaveSubmit = async () => {
    const payload = {
      staff_id: staffId, // Replace with actual staff ID
      body: {
        date: format(date || new Date(), "yyyy-MM-dd"),
        reason,
      },
    };

    console.log("Submitting Full Day Leave Request:", payload);
    // Implement submission logic here

    try {
      const res = await fullDayLeaveRequest(payload).unwrap();
      console.log("Leave request successful:", res);
      if (res) {
        toast.success(res.message || "Leave request submitted successfully");
        setModalOpen(false);
      }
      // Optionally show a success message to the user
    } catch (err) {
      console.error("Leave request failed:", err);
      // Optionally show an error message to the user
      const error = err as { data?: { message: string } };
      toast.error(error?.data?.message || "Failed to submit leave request");
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Full Day Leave Application
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-5">
          <div className="space-y-5 w-full">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Conditional Rendering based on Short Leave vs Day Leave */}
            {/* <div className="space-y-2">
              <Label>Number of Days</Label>
              <Input
                type="number"
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value)}
                step="0.5"
              />
            </div> */}

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Explain the reason for leave..."
                className="resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between mt-4 gap-2">
            {/* <Button variant="outline">Save Draft</Button> */}
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleFullDayLeaveSubmit}
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
