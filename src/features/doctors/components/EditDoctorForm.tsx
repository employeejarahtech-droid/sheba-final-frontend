"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/lib/cookies";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DoctorItem = {
  id: string;
  doctor_name: string;
  title: string;
  qualification: string;
  speciality: string;
  country: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  score: number;
  doctor_type_id?: number;
  doctor_type_ids?: number[];
};

export function EditDoctorForm({
  open,
  setOpen,
  doctorId
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  doctorId: string | null;
}) {
  const queryClient = useQueryClient();
  const token = getCookie('accessToken');

  // Form state
  const [doctorName, setDoctorName] = useState("");
  const [title, setTitle] = useState("");
  const [qualification, setQualification] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [score, setScore] = useState(0);
  const [doctorTypeIds, setDoctorTypeIds] = useState<number[]>([]);

  // Fetch doctor types
  const { data: doctorTypes = [], isLoading: isLoadingDoctorTypes } = useQuery({
    queryKey: ["doctor-types"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch doctor types");
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!token,
  });

  // Fetch doctor data when doctorId changes
  const { data: doctorData } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch doctor");
      return res.json();
    },
    enabled: !!doctorId && !!token && open,
  });

  // Populate form when doctor data is loaded
  useEffect(() => {
    if (doctorData?.data) {
      const doctor = doctorData.data;
      setDoctorName(doctor.doctor_name || "");
      setTitle(doctor.title || "");
      setQualification(doctor.qualification || "");
      setSpeciality(doctor.speciality || "");
      setCountry(doctor.country || "");
      setCity(doctor.city || "");
      setPhone(doctor.phone || "");
      setMobile(doctor.mobile || "");
      setEmail(doctor.email || "");
      setScore(doctor.score || 0);
      // Handle multiple doctor types - if single value, convert to array
      if (doctor.doctor_type_ids) {
        setDoctorTypeIds(doctor.doctor_type_ids);
      } else if (doctor.doctor_type_id) {
        setDoctorTypeIds([doctor.doctor_type_id]);
      } else {
        setDoctorTypeIds([]);
      }
    }
  }, [doctorData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedDoctor: Partial<DoctorItem>) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedDoctor),
        }
      );
      if (!res.ok) throw new Error("Failed to update doctor");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Doctor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update doctor");
    },
  });

  const resetForm = () => {
    setDoctorName("");
    setTitle("");
    setQualification("");
    setSpeciality("");
    setCountry("");
    setCity("");
    setPhone("");
    setMobile("");
    setEmail("");
    setScore(0);
    setDoctorTypeIds([]);
  };

  const handleSubmit = () => {
    if (!doctorId) {
      toast.error("No doctor selected");
      return;
    }

    const updatedDoctor = {
      doctor_name: doctorName,
      title,
      qualification,
      speciality,
      country,
      city,
      phone,
      mobile,
      email,
      score: Number(score),
      doctor_type_ids: doctorTypeIds,
    };

    updateMutation.mutate(updatedDoctor);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Doctor</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 p-4">

          {/* Doctor Name */}
          <div className="space-y-2">
            <Label>Doctor's Name</Label>
            <Input placeholder="Enter name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Dr., Prof., etc." value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Qualification */}
          <div className="space-y-2">
            <Label>Qualification</Label>
            <Input placeholder="MBBS, MD, etc." value={qualification} onChange={(e) => setQualification(e.target.value)} />
          </div>

          {/* Speciality */}
          <div className="space-y-2">
            <Label>Speciality</Label>
            <Input placeholder="Cardiology, Neurology, etc." value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
          </div>

          {/* Doctor Types - Multi Select */}
          <div className="space-y-2">
            <Label>Doctor Types</Label>
            {isLoadingDoctorTypes ? (
              <div className="text-sm text-muted-foreground">Loading doctor types...</div>
            ) : doctorTypes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No doctor types available.
                <a
                  href="/dashboard/indoor/master/doctor-types"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-2"
                >
                  Create doctor types
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {doctorTypes.map((type: any) => {
                    const isSelected = doctorTypeIds.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDoctorTypeIds(doctorTypeIds.filter((id: number) => id !== type.id));
                          } else {
                            setDoctorTypeIds([...doctorTypeIds, type.id]);
                          }
                        }}
                        className={`
                          inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                          transition-colors
                          ${
                            isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-input'
                          }
                        `}
                      >
                        {type.name}
                        {isSelected && <span className="h-4 w-4">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {doctorTypeIds.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {doctorTypeIds.length} type(s) selected
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label>Country</Label>
            <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>City</Label>
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Score */}
          <div className="space-y-2">
            <Label>Score</Label>
            <Input type="number" placeholder="0–100" value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update Doctor"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
