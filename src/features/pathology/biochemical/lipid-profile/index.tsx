
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { EditLipidProfileForm } from "./components/EditLipidProfileForm";
import { useState } from "react";
import { getCookie } from "@/lib/cookies";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";

type ReportsItem = {
  id: string;
  receiptId: string;
  patientName: string;
  tests: string[];
  date: string;
};

export default function LipidProfile() {
  const [open, setOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["lipid-profile", page],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lipid-profile?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lipid profiles");
      return res.json(); // MUST match placeholderData
    },

    enabled: !!token,

    // ⭐ Perfect smooth pagination
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        },
  });


  console.log(data?.data);

  const columns = [
    {
      data: "id",
      title: "ID",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.id;
      },
      defaultContent: "",
    },
    {
      data: "receiptId",
      title: "Receipt ID",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.receiptId;
      },
      defaultContent: "",
    },
    {
      data: "patientName",
      title: "Patient Name",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.patientName;
      },
      defaultContent: "",
    },
    {
      data: "tests",
      title: "Tests",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return Array.isArray(row.tests) ? row.tests.join(", ") : row.tests;
      },
      defaultContent: "",
    },
    {
      data: "date",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return row.date;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2"
              onclick="window.editLipidProfile('${row.id}')"
            >
              Edit
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-4 py-2"
              onclick="window.deleteLipidProfile('${row.id}')"
            >
              Delete
            </button>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  // Expose functions to window for onclick handlers
  if (typeof window !== 'undefined') {
    (window as any).editLipidProfile = (id: string) => {
      console.log('Edit lipid profile:', id);
      // TODO: Open edit form with reportId and invoiceId
      setOpen(true);
    };
    (window as any).deleteLipidProfile = (id: string) => {
      if (confirm('Are you sure you want to delete this lipid profile?')) {
        console.log('Delete lipid profile:', id);
        // TODO: Implement delete
      }
    };
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Lipid Profile</h1>
        </div>
        <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} />
        <EditLipidProfileForm open={open} setOpen={setOpen} reportId={0} invoiceId={0} />
      </Main>
    </>

  )

}
