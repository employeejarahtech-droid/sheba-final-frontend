/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapEmbed } from "@/components/MapEmbed";
import { GoogleMapEmbed } from "@/components/GoogleMapEmbed";
import { type StaffAttendance } from "@/store/features/checkIn/checkIn";
import { type Customer } from "@/store/features/customers/types";

type ModalProps =
  | {
    attendance: StaffAttendance;
    onClose: () => void;
  }
  | {
    customer: Customer;
    checkins: any[];
    onClose: () => void;
  };

export default function CheckInLocationModal(props: ModalProps) {
  const { onClose } = props;

  // Type guard or simple check for attendance
  const isSingleAttendance = "attendance" in props;

  // Extract data based on which prop set was provided
  const attendance = isSingleAttendance ? props.attendance : null;
  const customer = isSingleAttendance ? props.attendance?.customer : props.customer;
  const checkins = isSingleAttendance ? [] : props.checkins;

  // Coordinate access needs to be careful because 'customer' in StaffAttendance
  // might have slightly different property names than official Customer type
  // (e.g. address is there, but latitude/longitude might be on attendance record)
  const lat = isSingleAttendance ? props.attendance?.latitude : (props.customer as any)?.latitude;
  const lng = isSingleAttendance ? props.attendance?.longitude : (props.customer as any)?.longitude;

  const hasCoords = typeof lat === "number" && typeof lng === "number";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-3xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-medium">
            {isSingleAttendance
              ? `Attendance Location — Staff ID: ${attendance?.staff_id}`
              : `Customer Location — ${customer?.name ?? "Unknown Customer"}`}
          </h2>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-500">Address</div>
            <div className="font-medium">{customer?.address ?? "—"}</div>
          </div>
          {isSingleAttendance && attendance && (
            <>
              <div>
                <div className="text-sm text-gray-500">Check-in Time</div>
                <div className="font-medium">{attendance?.check_in_time ? new Date(attendance.check_in_time).toLocaleString() : "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Distance</div>
                <div className="font-medium">{attendance?.distance_meters ?? 0}m</div>
              </div>
            </>
          )}
          <div>
            <div className="text-sm text-gray-500">Coordinates</div>
            <div className="font-medium">
              {lat ?? "—"}, {lng ?? "—"}
            </div>
          </div>

          <div className="w-full h-64 rounded overflow-hidden border">
            {hasCoords ? (
              <div className="w-full h-full">
                <GoogleMapEmbed
                  center={{ lat: lat!, lng: lng! }}
                  zoom={16}
                  startLocation={{
                    lat: lat!,
                    lng: lng!,
                    name: isSingleAttendance ? `Staff ${attendance?.staff_id}` : (customer?.name ?? "Customer"),
                  }}
                  endLocation={{
                    lat: lat!,
                    lng: lng!,
                    name: isSingleAttendance ? `Staff ${attendance?.staff_id}` : (customer?.name ?? "Customer"),
                  }}
                  customerMarkers={checkins.map((ci: any) => ({
                    lat: parseFloat(ci.latitude),
                    lng: parseFloat(ci.longitude),
                    name: `Check-in: ${new Date(ci.check_in_time).toLocaleTimeString()}`,
                  }))}
                />
              </div>
            ) : (
              customer?.address ? (
                <MapEmbed location={customer?.address} />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
                  No location data available
                </div>
              )
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
