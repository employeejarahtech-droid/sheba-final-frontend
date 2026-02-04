import { useParams } from "react-router";

export default function AttendanceDetailsPage() {
    const { staffId } = useParams();
    console.log("Staff ID:", staffId);
  return (
    <div>
      Individual Staff {staffId} Attendance Page
    </div>
  )
}
