/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, type JSX } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { format } from "date-fns";
import CheckInLocationModal from "./CheckInLocationModal";
import { useGetAllStaffAttendanceQuery, type StaffAttendance } from "@/store/features/checkIn/checkIn";
import ClenderButton from "./ClenderButton";

/* ================= COMPONENT ================= */

export default function CheckInList(): JSX.Element {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [locationItem, setLocationItem] = useState<StaffAttendance | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: response, isFetching, isLoading } = useGetAllStaffAttendanceQuery({
    page,
    limit,
    search,
    date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  const attendanceItems = useMemo(() => response?.data || [], [response]);
  const totalCount = useMemo(() => response?.pagination?.total || 0, [response]);

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo<ColumnDef<StaffAttendance>[]>(
    () => [
      {
        accessorKey: "staff",
        header: "Checked-in User",
        cell: ({ row }) => {
          const staff = row.original.staff;
          return staff?.first_name ? `${staff.first_name} ${staff.last_name}` : staff?.name || "N/A";
        },
      },
      {
        accessorKey: "customer.name",
        header: "Customer Name",
        cell: ({ row }) => row.original.customer.name,
      },
      {
        accessorKey: "customer.company",
        header: "Company",
        cell: ({ row }) => row.original.customer.company,
      },
      {
        accessorKey: "check_in_time",
        header: "Check-in Time",
        cell: ({ row }) => {
          const date = new Date(row.original.check_in_time);
          return isNaN(date.getTime()) ? row.original.check_in_time : date.toLocaleString();
        },
      },
      {
        accessorKey: "distance_meters",
        header: "Distance (m)",
        cell: ({ row }) => `${row.original.distance_meters}m`,
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) =>
          row.original.latitude && row.original.longitude
            ? `${row.original.latitude.toFixed(4)}, ${row.original.longitude.toFixed(4)}`
            : row.original.customer.address || "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            className="border px-3 py-1 rounded hover:bg-gray-100 text-sm"
            onClick={() => setLocationItem(row.original)}
          >
            View Location
          </button>
        ),
      },
    ],
    []
  );

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Check In List</h1>
        <ClenderButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <div className="bg-white">
        <DataTable
          columns={columns}
          data={attendanceItems}
          pageIndex={page - 1}
          pageSize={limit}
          totalCount={totalCount}
          onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          isFetching={isFetching || isLoading}
        />
      </div>

      {locationItem && (
        <CheckInLocationModal
          attendance={locationItem}
          onClose={() => setLocationItem(null)}
        />
      )}
    </div>
  );
}
