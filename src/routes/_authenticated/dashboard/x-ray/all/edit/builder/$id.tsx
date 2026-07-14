import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, User, FileText, PenLine, ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GallerySelector } from '@/components/gallery-selector';

type XrayImage = { key: string | null; url: string };

export const Route = createFileRoute(
  '/_authenticated/dashboard/x-ray/all/edit/builder/$id',
)({
  component: XRayBuilder,
})

function XRayBuilder() {
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

  // Fetch X-Ray record data
  const { data: xrayData, isLoading } = useQuery({
    queryKey: ["xray-record", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/xray-all/builder/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch X-Ray data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize Summernote when data and library are loaded
  useEffect(() => {
    if (summernoteInitialized && editorRef.current && xrayData && !editorReady) {
      const $ = (window as any).$;
      if ($) {
        console.log('Initializing Summernote...');
        console.log('X-Ray data:', xrayData);
        try {
          $(editorRef.current).summernote({
            height: 500,
            toolbar: [
              ['style', ['style']],
              ['font', ['bold', 'italic', 'underline', 'clear']],
              ['fontsize', ['fontsize']],
              ['fontname', ['fontname']],
              ['color', ['color']],
              ['para', ['ul', 'ol', 'paragraph']],
              ['insert', ['link', 'picture', 'hr']],
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
                  console.log('Setting initial content:', xrayData.test_result);
                  if (xrayData.test_result) {
                    $(editorRef.current).summernote('code', xrayData.test_result);
                    console.log('Content set successfully');
                  } else {
                    console.log('No test_result to set');
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
  }, [summernoteInitialized, xrayData, editorReady]);

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      console.log('Saving content for ID:', id);
      console.log('Content length:', newContent?.length || 0);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/xray-all/${id}`,
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

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to update X-Ray record (${res.status}): ${errorText}`);
      }

      const result = await res.json();
      console.log('Update successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xray-record", id] });
      queryClient.invalidateQueries({ queryKey: ["xray-invoice"] });
      queryClient.invalidateQueries({ queryKey: ["xray-all"] });
      toast.success('Content updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast.error(`Error updating content: ${error.message}`);
    },
  });

  const handleSave = () => {
    const $ = (window as any).$;
    if ($ && editorRef.current) {
      const content = $(editorRef.current).summernote('code');
      updateMutation.mutate(content);
    }
  };

  // Attaches an already-hosted URL (picked/uploaded via the shared Image
  // Gallery modal) to this X-ray record — no re-upload, the Gallery module
  // already stored the file in Spaces.
  const attachImageMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/xray-all/${id}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Failed to attach image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xray-record", id] });
      toast.success('Image added');
    },
    onError: () => toast.error('Failed to add image'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (image: XrayImage) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/xray-all/${id}/images`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(image.key ? { key: image.key } : { url: image.url }),
      });
      if (!res.ok) throw new Error('Failed to delete image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xray-record", id] });
      toast.success('Image removed');
    },
    onError: () => toast.error('Failed to remove image'),
  });

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
                  X-Ray Content Builder
                </h1>
                <p className="text-muted-foreground text-sm">Edit and format the X-Ray report content</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.navigate({ to: '/dashboard/x-ray/all/print/$id', params: { id } })}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="default" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Content'}
              </Button>
            </div>
          </div>

          {/* Patient Information Card */}
          {xrayData?.invoice_information && (
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-950/30 dark:to-gray-900/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg shadow-lg">
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
                      RPT-{xrayData.invoice_information.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Patient Name</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {xrayData.invoice_information.patient_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Age</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {xrayData.invoice_information.age || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gender</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {xrayData.invoice_information.sex || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Record Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Test Record</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">X-Ray record details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Record ID: </span>
                  <span className="font-medium">{id}</span>
                </div>
                {xrayData?.test_name && (
                  <div>
                    <span className="text-muted-foreground">Test Name: </span>
                    <span className="font-medium">{xrayData.test_name}</span>
                  </div>
                )}
                {xrayData?.test_id && (
                  <div>
                    <span className="text-muted-foreground">Test ID: </span>
                    <span className="font-medium">{xrayData.test_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* X-Ray Images Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">X-Ray Images</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Upload the scanned X-ray image(s) for this report</p>
                  </div>
                </div>
                <GallerySelector
                  onImageSelect={(url) => attachImageMutation.mutate(url)}
                  triggerLabel={attachImageMutation.isPending ? 'Adding...' : 'Upload Image'}
                  defaultFolder="X-Ray"
                  aspectRatio="square"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(xrayData?.image_urls || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No X-ray images uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(xrayData?.image_urls || []).map((img: XrayImage) => (
                    <div key={img.url} className="relative aspect-square rounded-lg overflow-hidden border group">
                      <img
                        src={img.url}
                        alt="X-ray scan"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(img.url, '_blank')}
                      />
                      <button
                        onClick={() => deleteImageMutation.mutate(img)}
                        disabled={deleteImageMutation.isPending}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity duration-300 hover:bg-red-600 group-hover:opacity-100 shadow-lg"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Editor Card */}
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

export default XRayBuilder
