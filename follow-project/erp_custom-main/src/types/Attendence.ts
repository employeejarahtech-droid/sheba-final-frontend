export type Attendance = {
  id: number;
  staff_id: number;
  date: string;       // "2025-12-02"
  check_in: string;   // "09:00:00"
  check_out: string;  // "18:00:00"
  status: "present" | "absent" | "late" | "leave" | string;
};
