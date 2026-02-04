/* eslint-disable react-hooks/incompatible-library */

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
import { useAssignStaffMutation, useGetSalesRouteByIdQuery } from "@/store/features/salesRoute/salesRoute";
import type { Staff } from "@/types/staff.types";
import { toast } from "sonner";

/* ================= TYPES ================= */

type AssignStaffForm = {
  staffIds: number[];
};

/* ================= COMPONENT ================= */

export default function AssignRoutePage() {
  const { routeId } = useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const limit = 10;
  const hasHydratedRef = useRef(false);


  /* ================= RHF ================= */

  const form = useForm<AssignStaffForm>({
    defaultValues: {
      staffIds: [],
    },
  });

  /* ================= API ================= */

  const { data, isLoading, isFetching } = useGetAllStaffsQuery({
    page,
    limit,
    search: searchTerm,
    status: "active",
  });

  const { data: SalesRouteData, isLoading: isLoadingSalesRoute } = useGetSalesRouteByIdQuery(routeId as string);
  const [assignStaff] = useAssignStaffMutation();

  /* ================= EFFECTS ================= */


  useEffect(() => {
    if (
      !hasHydratedRef.current &&
      SalesRouteData?.data?.assignedStaffMembers
    ) {
      const ids =
        SalesRouteData.data.assignedStaffMembers.map(
          (staff) => staff.id
        );

      form.reset({
        staffIds: ids,
      });

      hasHydratedRef.current = true;
    }
  }, [SalesRouteData, form]);



  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllStaff(data.data);
      } else {
        setAllStaff((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, page]);








  /* ================= HELPERS ================= */

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const toggleStaff = (id: number, value: number[]) => {
    return value.includes(id)
      ? value.filter((s) => s !== id)
      : [...value, id];
  };

  const getInitials = (f?: string, l?: string) =>
    `${f?.charAt(0) || ""}${l?.charAt(0) || ""}`.toUpperCase();

  const hasMore =
    (data?.pagination?.total ?? 0) > allStaff.length;

  /* ================= SUBMIT ================= */

  const handleAssignStaffs = async () => {
    if (!routeId) return;

    const staffIds = form.getValues("staffIds");

    try {
      const res = await assignStaff({
        routeId,
        body: { staff_ids: staffIds },
      }).unwrap();

      if (res.status) {
        toast.success(res.message || "Staff assigned successfully");
      }
    } catch (error) {
      console.log("Assign staff error:", error);
    }
  };

  /* ================= JSX ================= */

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* HEADER */}
      <header className="sticky top-10 z-10 bg-white border-b px-4 py-4 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/sales/sales-routes">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Assign Staff</h1>
              <p className="text-xs text-muted-foreground">
                Route: Downtown Area
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            {form.watch("staffIds").length} Selected
          </Badge>
        </div>
      </header>

      {/* SEARCH */}
      <div className="sticky top-24 z-10 px-4 pt-6 sm:px-8">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search team members..."
            className="pl-10 h-11"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* STAFF LIST */}
      <main className="flex-1 px-4 sm:px-8 pb-32">
        <div className="max-w-2xl mx-auto py-6">
          <Controller
            name="staffIds"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                {allStaff.length > 0 ? (
                  data?.data?.map((staff) => {
                    const isSelected = field.value.includes(staff.id);

                    return (
                      <div
                        key={staff.id}
                        onClick={() =>
                          field.onChange(
                            toggleStaff(staff.id, field.value)
                          )
                        }
                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isSelected
                          ? "bg-blue-50 border-blue-100"
                          : "hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staff.thumb_url} />
                            <AvatarFallback>
                              {getInitials(
                                staff.first_name,
                                staff.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="text-sm font-semibold">
                              {staff.first_name} {staff.last_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {staff.email}
                            </p>
                          </div>
                        </div>

                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            field.onChange(
                              toggleStaff(staff.id, field.value)
                            )
                          }
                        />
                      </div>
                    );
                  })
                ) : !isLoading ? (
                  <div className="text-center py-20">
                    <Users className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-500">
                      No members found
                    </p>
                  </div>
                ) : null}
                {hasMore && (
                  <div className="py-10 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="
        h-11 px-10 rounded-xl
        text-xs font-semibold uppercase tracking-wider
        border-slate-200 text-slate-600
        hover:bg-slate-900 hover:text-white
        transition-all duration-200
        shadow-sm hover:shadow-md
      "
                    >
                      {isFetching ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Staff"
                      )}
                    </Button>
                  </div>
                )}


              </div>
            )}
          />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="max-w-2xl mx-auto flex justify-center gap-4">
          <Button
            variant="ghost"
            className="min-w-[140px]"
            onClick={() => form.setValue("staffIds", [])}
          >
            Clear All
          </Button>

          <Button
            className="min-w-[180px] bg-blue-600 hover:bg-blue-700"
            disabled={
              isLoadingSalesRoute ||
              form.watch("staffIds").length === 0
            }
            onClick={handleAssignStaffs}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save Assignments
          </Button>
        </div>
      </footer>

    </div>
  );
}


