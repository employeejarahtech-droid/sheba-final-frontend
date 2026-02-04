/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
import {
  useGetAllAttendanceQuery,
  useCheckInMutation,
} from "@/store/features/attendence/attendenceApiService";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Staff } from "@/types/staff.types";
import type { Attendance } from "@/types/Attendence.types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { CalendarPlus, Info } from "lucide-react";
import LeaveRequestModal from "../leaves/LeaveRequestModal";
import ShortLeaveRequestModal from "../leaves/ShortLeaveModal";
import AttendanceDetailsModal from "./AttendanceDetailsModal";

export default function AttendancePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveRequestModalOpen, setLeaveRequestModalOpen] = useState(false);
  const [shortLeaveRequestModalOpen, setShortLeaveRequestModalOpen] = useState(false);
  const [showAttendanceDetailsModal, setShowAttendanceDetailsModal] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: staffsData } = useGetAllStaffsQuery({
    page,
    limit,
    search: "",
  });
  const { data: attendanceData } = useGetAllAttendanceQuery({
    page,
    limit,
    search: "",
  });

  const [checkInMutation, { isLoading: isCheckingIn }] = useCheckInMutation();

  const staffsList: Staff[] = (staffsData?.data as Staff[]) ?? [];
  const attendances: Attendance[] =
    (attendanceData?.data as Attendance[]) ?? [];

  const totalCount = staffsData?.pagination?.total || 0;
  const totalPages = staffsData?.pagination?.totalPage || 1;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const handleOpenModal = (staff: Staff) => {
    setCurrentStaff(staff);
    setModalOpen(true);
    setStartTime("09:00");
    setEndTime("18:00");
  };

  const handleConfirmAttendance = async () => {
    if (!currentStaff) return;

    const payload = {
      date: format(selectedDate, "yyyy-MM-dd"),
      start_at: startTime + ":00",
      end_at: endTime + ":00",
      total_hour:
        (Number(endTime.split(":")[0]) - Number(startTime.split(":")[0])) / 8,
    };

    //console.log("Attendance Payload:", payload);

    try {
      const res = await checkInMutation({
        staff_id: currentStaff.id,
        data: payload,
      }).unwrap();

      if (res) {
        toast.success("Attendance recorded successfully");
        setModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Attendance logging failed");
    }
  };

  const getStaffAttendance = (staffId: string) => {
    if (!selectedDate) return undefined; // avoid formatting undefined
    return attendances?.find(
      (att) =>
        String(att.staff_id) === staffId && // convert number to string
        att.date === format(selectedDate, "yyyy-MM-dd")
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">
          Attendance - {format(selectedDate, "PPP")}
        </h1>

        {/* Date picker from header */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{format(selectedDate, "PPP")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-2 w-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              autoFocus
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Staff list */}
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
              <Info className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Staff Attendance</h2>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {staffsList?.length === 0 ? (
            <p className="text-gray-500">No staff records found.</p>
          ) : (
            <ul className="space-y-4">
              {staffsList.map((staff) => {
                const attendance = getStaffAttendance(staff.id as any);
                return (
                  <li
                    key={staff.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:shadow transition"
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div>
                        <p className="font-semibold">
                          {staff.first_name} {staff.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {staff.department?.name || "N/A"}
                        </p>
                      </div>

                      {attendance && (
                        <div className="flex flex-col text-sm text-gray-600 space-y-1">
                          {attendance.check_in && (
                            <p className="text-green-600">
                              ✔ Arrival: {attendance.check_in.slice(0, 5)}
                            </p>
                          )}
                          {attendance.check_out && (
                            <p className="text-blue-600">
                              ✔ Leaving: {attendance.check_out.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setCurrentStaff(staff);
                          setLeaveRequestModalOpen(true);
                        }}
                      >
                        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                        <span>Full Day Leave</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setCurrentStaff(staff);
                          setShortLeaveRequestModalOpen(true);
                        }}
                      >
                        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                        <span>Short Leave</span>
                      </Button>
                      {!attendance?.check_in && (
                        <Button
                          onClick={() => handleOpenModal(staff)}
                          disabled={isCheckingIn}
                        >
                          Mark Attendance
                        </Button>
                      )}

                      {/* 👇 View button */}
                      <Button variant="outline" onClick={() => {
                        setCurrentStaff(staff);
                        setShowAttendanceDetailsModal(true);
                      }}>
                        View Attendances
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)}{" "}
          of {totalCount} results
        </p>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm focus:outline-none"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modal for selecting start & end time */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Log Attendance - {currentStaff?.first_name}{" "}
                {currentStaff?.last_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="block"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="block"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAttendance}
                  disabled={isCheckingIn}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <LeaveRequestModal modalOpen={leaveRequestModalOpen} setModalOpen={setLeaveRequestModalOpen} staffId={Number(currentStaff?.id)} />
      <ShortLeaveRequestModal modalOpen={shortLeaveRequestModalOpen} setModalOpen={setShortLeaveRequestModalOpen} staffId={Number(currentStaff?.id)} />
      <AttendanceDetailsModal modalOpen={showAttendanceDetailsModal} setModalOpen={setShowAttendanceDetailsModal} staff={currentStaff} />
    </div>
  );
}

//   ---------------------------------- previous code base ----------------

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link } from "react-router";
// import { ArrowLeft } from "lucide-react";
// import { useState } from "react";
// import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
// import type { Staff } from "@/types/staff.types";
// import {
//   useCheckInMutation,
//   useCheckOutMutation,
//   useGetAllAttendanceQuery,
// } from "@/store/features/attendence/attendenceApiService";
// import { toast } from "sonner";
// import type { Attendance } from "@/types/Attendence.types";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";

// export default function AttendancePage() {
//   //const [isChecked, setIsChecked] = useState(false);
//   const [isCheckInOpen, setIsCheckInOpen] = useState(false);
//   const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

//   const [checkInDate, setCheckInDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );

//   const [checkInTime, setCheckInTime] = useState(
//     new Date().toLocaleTimeString("en-GB")
//   );

//   const [checkOutDate, setCheckOutDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [checkOutTime, setCheckOutTime] = useState(
//     new Date().toLocaleTimeString("en-GB")
//   );

//   const [staff, setStaff] = useState<Staff | null>(null);
//   const [page, setPage] = useState<number>(1);
//   const [search] = useState<string>("");
//   const [limit] = useState(10);
//   const { data: staffsData } = useGetAllStaffsQuery({ page, limit, search });

//   //console.log("staffsData", staffsData);

//   const staffsList = staffsData?.data as Staff[] | [];
//   const totalCount: number = staffsData?.pagination?.total || 0;
//   const totalPages: number = staffsData?.pagination?.totalPage || 1;
//   const pageSize: number = staffsData?.pagination?.limit || 10;
//   const pageIndex = page - 1;

//   const { data: attendancesData } = useGetAllAttendanceQuery({
//     page,
//     limit,
//     search,
//   });

//   const attendances = attendancesData?.data as Attendance[] | [];

//   console.log("attendances", attendances);

//   const staffAttendance = attendances?.find(
//     (item) => item.staff_id === staff?.id
//   );

//   console.log("staffAttendance", staffAttendance);

//   // useEffect(() => {
//   //   if (staffAttendance) {
//   //     setCheckInTime(staffAttendance?.check_in);
//   //     setCheckOutTime(staffAttendance?.check_out);
//   //   }
//   // }, [staffAttendance]);

//   const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
//   const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

//   const handleCheckIn = async () => {
//     if (!staff) return;

//     try {
//       await checkIn({
//         staff_id: staff.id,
//         date: checkInDate,
//         check_in: checkInTime || "",
//         status: "present",
//       }).unwrap();

//       toast.success("Check-in successful");
//     } catch (err) {
//       console.error("Check-in failed:", err);

//       const error = err as {
//         data?: { message?: string };
//       };

//       toast.error(error.data?.message || "Check-in failed");
//     }
//   };

//   const handleCheckOut = async () => {
//     if (!staff) return;

//     try {
//       await checkOut({
//         staff_id: staff.id,
//         date: checkOutDate,
//         check_out: checkOutTime || "",
//         status: "present",
//       });
//     } catch (err) {
//       console.error("Check-out failed:", err);

//       const error = err as {
//         data?: { message?: string };
//       };

//       toast.error(error.data?.message || "Check-out failed");
//     }
//   };

//   //console.log("staff", staff);

//   return (
//     <>
//       <div className="w-full">
//         <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
//           <h1 className="text-3xl font-bold">Today's Attendance</h1>

//           <Link to="/dashboard/staffs">
//             <Button variant="outline">
//               <ArrowLeft />
//               Back to Staffs
//             </Button>
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 gap-6">
//           {/* CHECKED-IN SECTION */}
//           <Card className="h-full">
//             <CardHeader>
//               <CardTitle>All Staffs</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {staffsList?.length === 0 ? (
//                 <p className="text-gray-500">No check-ins yet today.</p>
//               ) : (
//                 <ul className="space-y-4">
//                   {staffsList?.map((staff) => {
//                     return (
//                       <li
//                         key={staff.id}
//                         className="flex justify-between p-4 border rounded-lg items-center"
//                       >
//                         <div>
//                           <p className="font-semibold">
//                             {staff?.first_name} {staff?.last_name}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             {staff?.department?.name || "N/A"}
//                           </p>
//                           {staffAttendance?.id && (
//                             <div className="mt-1 text-xs text-gray-600 space-y-1">
//                               {checkInTime && (
//                                 <p className="text-green-600">
//                                   ✔ Checked In: {checkInTime}
//                                 </p>
//                               )}
//                               {checkOutTime && (
//                                 <p className="text-blue-600">
//                                   ✔ Checked Out: {checkOutTime}
//                                 </p>
//                               )}
//                             </div>
//                           )}
//                         </div>

//                         <div className="flex gap-3 mt-4">
//                           <Button
//                             onClick={() => {
//                               setStaff(staff);
//                               setIsCheckInOpen(true);
//                             }}
//                             disabled={!staff.id || isCheckingIn}
//                           >
//                             Check In
//                           </Button>

//                           <Button
//                             onClick={() => {
//                               setStaff(staff);
//                               setIsCheckOutOpen(true);
//                             }}
//                             variant="outline"
//                             disabled={!staff.id || isCheckingOut}
//                           >
//                             Check Out
//                           </Button>
//                         </div>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               )}
//             </CardContent>
//           </Card>

//           {/* ABSENT SECTION */}
//           {/* <Card className="h-full">
//           <CardHeader>
//             <CardTitle>Absent (No Check-in)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ul className="space-y-4">
//               {absent.map((staff, idx) => (
//                 <li
//                   key={idx}
//                   className="border rounded-lg p-4 flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-semibold">{staff.name}</p>
//                     <p className="text-sm text-gray-500">
//                       {staff.id} · {staff.dept}
//                     </p>
//                   </div>

//                   <Button variant="secondary" className="bg-gray-200">
//                     Absent
//                   </Button>
//                 </li>
//               ))}
//             </ul>
//           </CardContent>
//         </Card> */}
//           <div className="flex items-center justify-between py-4">
//             <div className="text-sm">
//               Showing {pageIndex * pageSize + 1}–
//               {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}{" "}
//               results
//             </div>

//             <div className="space-x-2 flex items-center">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage(page - 1)}
//                 disabled={page <= 1}
//               >
//                 Previous
//               </Button>

//               <div className="flex items-center gap-1 text-sm">
//                 <span>Page</span>
//                 <select
//                   value={page}
//                   onChange={(e) => setPage(Number(e.target.value))}
//                   className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
//                 >
//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//                     (p) => (
//                       <option key={p} value={p}>
//                         {p}
//                       </option>
//                     )
//                   )}
//                 </select>
//                 <span>of {totalPages}</span>
//               </div>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage(page + 1)}
//                 disabled={page >= totalPages}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//       {isCheckInOpen && (
//         <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Check In</DialogTitle>
//             </DialogHeader>

//             <div className="space-y-4">
//               <div>
//                 <Label>Date</Label>
//                 <Input
//                   type="date"
//                   value={checkInDate}
//                   onChange={(e) => setCheckInDate(e.target.value)}
//                 />
//               </div>

//               <div>
//                 <Label>Time</Label>
//                 <Input
//                   type="time"
//                   value={checkInTime.slice(0, 5)}
//                   onChange={(e) => setCheckInTime(`${e.target.value}:00`)}
//                 />
//               </div>

//               <div className="flex justify-end gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={() => setIsCheckInOpen(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button onClick={handleCheckIn} disabled={isCheckingIn}>
//                   Confirm Check In
//                 </Button>
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//       {isCheckOutOpen && (
//         <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Check In</DialogTitle>
//             </DialogHeader>

//             <div className="space-y-4">
//               <div>
//                 <Label>Date</Label>
//                 <Input
//                   type="date"
//                   value={checkOutDate}
//                   onChange={(e) => setCheckOutDate(e.target.value)}
//                 />
//               </div>

//               <div>
//                 <Label>Time</Label>
//                 <Input
//                   type="time"
//                   value={checkOutTime.slice(0, 5)}
//                   onChange={(e) => setCheckOutTime(`${e.target.value}:00`)}
//                 />
//               </div>

//               <div className="flex justify-end gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={() => setIsCheckOutOpen(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button onClick={handleCheckOut} disabled={isCheckingOut}>
//                   Confirm Check Out
//                 </Button>
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </>
//   );
// }
