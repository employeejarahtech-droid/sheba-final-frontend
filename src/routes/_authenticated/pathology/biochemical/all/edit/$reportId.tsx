import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/all/edit/$reportId',
)({
  component: EditReport,
})

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
 type LabTest = {
  id: string
  testName: string
  testResult: string
  range: string
}


const testData: LabTest[] = [
  { id: "1", testName: "Hemoglobin", testResult: "13.2 g/dL", range: "12–16 g/dL" },
  { id: "2", testName: "WBC Count", testResult: "7,500 /µL", range: "4,000–11,000 /µL" },
  { id: "3", testName: "Platelet Count", testResult: "220,000 /µL", range: "150,000–400,000 /µL" },
]

function EditReport() {
const params = Route.useParams();
const reportId = params.reportId!

  return (
    <>
      {/* Header */}
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main */}
    <Main>
        <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Report - Biochemical</h1>
        <Card>
          <CardContent>
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "RPT-1017",
                patientName: "Sadia Hossain",
                age: "37 Years",
                gender: "Female",
              }}
            />
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardContent>
            <form>
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Test Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Test Result</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Range</th>
                  </tr>
                </thead>

                <tbody>
                  {testData.map((test, index) => (
                    <tr
                      key={test.id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">{test.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">{test.testName}</td>

                      {/* Input field for testResult */}
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">
                        <textarea
                          value={test.testResult}
                          className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                          onChange={() => { console.log("Test Result Updated") }}
                        />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 border-b">{test.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center gap-3 pt-4">
                <Button type="submit" variant="success">
                  Save Report
                </Button>

                <Link to="/pathology/biochemical/all/report/$reportId" params={{ reportId: reportId }}>
                  <Button type="button" variant="default">
                    Print Preview
                  </Button>
                </Link>

              </div>
            </form>

          </CardContent>
        </Card>
      </Main>
    </>
  );
}


