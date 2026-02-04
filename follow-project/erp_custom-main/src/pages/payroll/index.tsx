import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
//import GeneratePayrollSheet from "./GeneratePayrollSheet";
//import { Payroll } from "./payroll-types";

type Payroll = {
    id: number;
    employee: string;
    month: string;
    basicSalary: number;
    additions: number;
    deductions: number;
    netSalary: number;
    status: string;
};

export default function PayrollPage() {

  const payrolls: Payroll[] =[
    {
      id: 1,
      employee: "John Doe",
      month: "January 2025",
      basicSalary: 2500,
      additions: 300,
      deductions: 100,
      netSalary: 2700,
      status: "Approved",
    },
    {
      id: 2,
      employee: "Sarah Ali",
      month: "January 2025",
      basicSalary: 2200,
      additions: 150,
      deductions: 50,
      netSalary: 2300,
      status: "Pending",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <Button onClick={() => alert("Generate Payroll")}>+ Generate Payroll</Button>
      </div>

      {/* Payroll List */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>

        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Employee</th>
                <th className="p-2">Month</th>
                <th className="p-2">Net Salary</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {payrolls.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.employee}</td>
                  <td className="p-2">{p.month}</td>
                  <td className="p-2">RM {p.netSalary.toFixed(2)}</td>
                  <td className="p-2">
                    <Badge
                      className={
                        p.status === "Approved"
                          ? "bg-green-600 text-white"
                          : "bg-yellow-500 text-white"
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="p-2 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => (window.location.href = `/payroll/${p.id}`)}
                    >
                      View
                    </Button>
                    <Button variant="outline">Download Slip</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Generate Payroll Sheet */}
      {/* <GeneratePayrollSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onGenerate={(newPayroll) =>
          setPayrolls((prev) => [
            ...prev,
            { id: prev.length + 1, ...newPayroll },
          ])
        }
      /> */}
    </div>
  );
}
