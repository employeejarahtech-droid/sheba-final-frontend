import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import HormoneReportDetails from '@/features/pathology/hormone/all-reports/HormoneReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Printer, Settings2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { useState } from 'react';
import { FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE, type FontSizeKey } from '@/lib/print-font-size';
import { COLUMN_LAYOUT_OPTIONS, DEFAULT_COLUMN_LAYOUT, type ColumnLayoutKey } from '@/lib/print-column-layout';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hormone/all/report/$reportId',
)({
  component: HormoneAllReports,
})

function HormoneAllReports() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const [paddingTop, setPaddingTop] = useState(100);
  const [fontSize, setFontSize] = useState<FontSizeKey>(DEFAULT_FONT_SIZE);
  const [columnLayout, setColumnLayout] = useState<ColumnLayoutKey>(DEFAULT_COLUMN_LAYOUT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSignature, setShowSignature] = useState(true);


  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["hormone-report", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hormon-all/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch hormone report");
      return res.json();
    },
    enabled: !!token && !!reportId,
  });

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen">Loading...</div>
        </Main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen text-red-500">Error loading report</div>
        </Main>
      </>
    );
  }

  const invoice = reportData?.data;

  if (!invoice) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen">Report not found</div>
        </Main>
      </>
    );
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/pathology/hormone/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/pathology/hormone/all/edit/$id" params={{ id: reportId }}>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
                <span>Print Settings</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="border-b px-4 py-3 gap-0">
                    <SheetTitle className="flex items-center gap-3 pr-8">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-base font-semibold text-left">Print Settings</div>
                            <SheetDescription className="text-xs font-normal text-left">Adjust how this report looks and prints</SheetDescription>
                        </div>
                    </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Select value={fontSize} onValueChange={(v) => setFontSize(v as FontSizeKey)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Font size" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(FONT_SIZE_OPTIONS).map(([key, opt]) => (
                                    <SelectItem key={key} value={key}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="padding-top" className="text-sm font-medium">Padding Top (px)</Label>
                        <Input
                            id="padding-top"
                            type="number"
                            min={0}
                            value={paddingTop}
                            onChange={(e) => setPaddingTop(Number(e.target.value) || 0)}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Column Width</Label>
                        <Select value={columnLayout} onValueChange={(v) => setColumnLayout(v as ColumnLayoutKey)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Column width" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(COLUMN_LAYOUT_OPTIONS).map(([key, opt]) => (
                                    <SelectItem key={key} value={key}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                            id="show-signature"
                            checked={showSignature}
                            onCheckedChange={(checked) => setShowSignature(checked === true)}
                        />
                        <Label htmlFor="show-signature" className="text-sm font-medium cursor-pointer select-none">
                            Signature
                        </Label>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
        <HormoneReportDetails invoice={invoice} testName="Hormone Report" paddingTop={paddingTop} fontSize={FONT_SIZE_OPTIONS[fontSize].zoom} showSignature={showSignature} columnLayout={columnLayout} />
      </Main>
    </>
  )
}
