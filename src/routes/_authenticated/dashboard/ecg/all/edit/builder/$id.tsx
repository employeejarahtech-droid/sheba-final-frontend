import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { summernoteTableButtons } from '@/lib/summernote-table-tools';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, User, FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/_authenticated/dashboard/ecg/all/edit/builder/$id',
)({
  component: ECGBuilder,
})

function ECGBuilder() {
  const { id } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();

  const editorRef = useRef<HTMLDivElement>(null);
  const [summernoteInitialized, setSummernoteInitialized] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // Load jQuery and Summernote CSS and JS
  useEffect(() => {
    let jqueryScript: HTMLScriptElement | null = null;
    let summernoteScript: HTMLScriptElement | null = null;
    const link: HTMLLinkElement = document.createElement('link');

    // Load Summernote CSS
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css';
    document.head.appendChild(link);

    // Load jQuery first (required for Summernote)
    jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    jqueryScript.onload = () => {
      console.log('jQuery loaded');

      // After jQuery loads, load Summernote
      summernoteScript = document.createElement('script');
      summernoteScript.src = 'https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js';
      summernoteScript.onload = () => {
        console.log('Summernote loaded');
        setSummernoteInitialized(true);
      };
      document.body.appendChild(summernoteScript);
    };
    document.body.appendChild(jqueryScript);

    return () => {
      // Cleanup
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (jqueryScript && document.body.contains(jqueryScript)) {
        document.body.removeChild(jqueryScript);
      }
      if (summernoteScript && document.body.contains(summernoteScript)) {
        document.body.removeChild(summernoteScript);
      }
    };
  }, []);

  // Fetch ECG record data
  const { data: ecgData, isLoading } = useQuery({
    queryKey: ["ecg-record", id],
    queryFn: async () => {
      const numericId = parseInt(id, 10);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all/builder/${numericId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch ECG data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize Summernote when data and library are loaded
  useEffect(() => {
    if (summernoteInitialized && editorRef.current && ecgData && !editorReady) {
      const $ = (window as any).$;
      if ($) {
        console.log('Initializing Summernote...');
        try {
          $(editorRef.current).summernote({
            height: 500,
            buttons: summernoteTableButtons($),
            toolbar: [
              ['style', ['style']],
              ['font', ['bold', 'italic', 'underline', 'clear']],
              ['fontsize', ['fontsize']],
              ['fontname', ['fontname']],
              ['color', ['color']],
              ['para', ['ul', 'ol', 'paragraph']],
              ['insert', ['link', 'hr', 'table']],
              ['table-tools', ['tableWidth', 'tableAlign', 'tableHead']],
              ['view', ['fullscreen', 'codeview']],
              ['help', ['help']]
            ],
            placeholder: 'Start typing your test result here...',
            callbacks: {
              onInit: function() {
                console.log('Summernote initialized successfully');
                setEditorReady(true);

                // Set initial content after a small delay to ensure editor is ready
                setTimeout(() => {
                  if (ecgData.test_result) {
                    $(editorRef.current).summernote('code', ecgData.test_result);
                  }
                }, 200);
              },
              onChange: function() {
                // Content is automatically available
              }
            }
          });
        } catch (error) {
          console.error('Error initializing Summernote:', error);
        }
      } else {
        console.error('jQuery not available');
      }
    }
  }, [summernoteInitialized, ecgData, editorReady]);

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const numericId = parseInt(id, 10);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all/${numericId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: newContent,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update ECG record (${res.status}): ${errorText}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecg-record", id] });
      queryClient.invalidateQueries({ queryKey: ["ecg-invoice"] });
      queryClient.invalidateQueries({ queryKey: ["ecg-all"] });
      toast.success('Content updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast.error(`Error updating content: ${error.message}`);
    },
  });

  const handleSave = () => {
    const $ = (window as any).$;
    if ($) {
      if (editorRef.current) {
        try {
          const content = $(editorRef.current).summernote('code');
          updateMutation.mutate(content);
        } catch (error) {
          console.error('Error getting content from Summernote:', error);
          toast.error('Error getting content from editor. Please try again.');
        }
      } else {
        toast.error('Editor not ready. Please wait a moment and try again.');
      }
    } else {
      toast.error('Editor not loaded properly. Please refresh the page.');
    }
  };

  const handleBack = () => {
    router.history.back();
  };

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Main>
      </>
    );
  }

  if (!summernoteInitialized) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading editor...</p>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <div className="space-y-5 w-full min-w-[650px] max-w-[950px] mx-auto px-4">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ECG Content Builder
                </h1>
                <p className="text-muted-foreground text-sm">Edit and format the ECG report content</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.navigate({ to: '/dashboard/ecg/all/print/$id', params: { id } })}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="default" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Content'}
              </Button>
            </div>
          </div>

          {/* Receipt Information Card */}
          {ecgData?.invoice_information && (
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Patient Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receipt and patient details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Invoice No</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      RPT-{ecgData.invoice_information.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Patient Name</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {ecgData.invoice_information.patient_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Age</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {ecgData.invoice_information.age || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gender</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {ecgData.invoice_information.sex || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Record Info Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Test Record</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">ECG record details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Record ID: </span>
                  <span className="font-medium">{id}</span>
                </div>
                {ecgData?.test_name && (
                  <div>
                    <span className="text-muted-foreground">Test Name: </span>
                    <span className="font-medium">{ecgData.test_name}</span>
                  </div>
                )}
                {ecgData?.test_id && (
                  <div>
                    <span className="text-muted-foreground">Test ID: </span>
                    <span className="font-medium">{ecgData.test_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HTML Editor Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-lg">
                  <PenLine className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Content Editor</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Use the toolbar to format your report</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Summernote Editor */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div
                  ref={editorRef}
                  id="summernote-editor"
                ></div>
              </div>

              {/* Footer Info */}
              <div className="flex justify-between text-sm text-gray-500 mt-4">
                <span>Use the toolbar above to format your content</span>
                <span>Powered by Summernote</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}

export default ECGBuilder
