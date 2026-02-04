import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useStaffWiseShortLeaveApplicationMutation } from "@/store/features/attendence/attendenceApiService";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ShortLeaveRequestModal({
  modalOpen,
  setModalOpen,
  staffId,
}: {
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  staffId: number;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [reason, setReason] = useState("");

  const [shortLeaveRequest] = useStaffWiseShortLeaveApplicationMutation();

  const handleShortLeaveSubmit = async () => {
    const payload = {
      staff_id: staffId, // Replace with actual staff ID
      body: {
        date: format(date || new Date(), "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        reason,
      },
    };

    console.log("Submitting Full Day Leave Request:", payload);
    // Implement submission logic here

    try {
      const res = await shortLeaveRequest(payload).unwrap();
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Short Leave Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Date */}
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
                      ) : "Pick a date"}
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

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-dashed bg-slate-50">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500">
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500">
                End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Explain the reason for short leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>

            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleShortLeaveSubmit}>
              <CheckCircle2 className="h-4 w-4" />
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
