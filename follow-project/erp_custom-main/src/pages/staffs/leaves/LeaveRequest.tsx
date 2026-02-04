import  { useState, useMemo } from "react";
import { CalendarIcon, CheckCircle2,  } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeaveRequest() {
  const [leaveType, setLeaveType] = useState("annual");
  const [durationType, setDurationType] = useState("days"); // "days" or "hours"
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // States for short leave logic
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [daysCount, setDaysCount] = useState("1");

  // Mock ERP Data
  const leaveBalances = { annual: 14.5, sick: 8, personal: 5, unpaid: 99 };
  const currentBalance = leaveBalances[leaveType as keyof typeof leaveBalances];

  // Logic to calculate deduction
  const deduction = useMemo(() => {
    if (durationType === "days") return parseFloat(daysCount) || 0;
    
    // Simple hourly calculation (adjust for your company policy)
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const totalHours = (endH + endM / 60) - (startH + startM / 60);
    return totalHours > 0 ? parseFloat((totalHours / 8).toFixed(2)) : 0; // Assuming 8hr work day
  }, [durationType, daysCount, startTime, endTime]);

  const remainingBalance = (currentBalance - deduction).toFixed(2);

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-xl shadow-xl border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Leave Application</CardTitle>
          <CardDescription>Select leave type and duration for approval.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Duration Type Toggle */}
          <Tabs defaultValue="days" className="w-full" onValueChange={setDurationType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="days">Full/Multi Day</TabsTrigger>
              <TabsTrigger value="hours">Short Leave (Hourly)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Conditional Rendering based on Short Leave vs Day Leave */}
          {durationType === "days" ? (
            <div className="space-y-2">
              <Label>Number of Days</Label>
              <Input 
                type="number" 
                value={daysCount} 
                onChange={(e) => setDaysCount(e.target.value)} 
                step="0.5" 
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea placeholder="Explain the reason for leave..." className="resize-none" />
          </div>

          {/* Balance Logic Display */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
            <div className="text-center">
              <p className="text-[10px] uppercase text-slate-500">Available</p>
              <p className="text-lg font-bold text-slate-700">{currentBalance}d</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-[10px] uppercase text-slate-500">Deduction</p>
              <p className="text-lg font-bold text-amber-600">-{deduction}d</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-slate-500">Remaining</p>
              <p className={cn(
                "text-lg font-bold",
                Number(remainingBalance) < 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {remainingBalance}d
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between bg-slate-50/50 rounded-b-xl border-t p-6">
          <Button variant="outline">Save Draft</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={Number(remainingBalance) < 0}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> 
            {Number(remainingBalance) < 0 ? "Insufficient Balance" : "Submit Request"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}