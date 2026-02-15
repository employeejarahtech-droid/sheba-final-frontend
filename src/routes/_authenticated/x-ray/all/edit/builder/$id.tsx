import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Card, CardContent } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topNav } from '@/data/data';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute(
  '/_authenticated/x-ray/all/edit/builder/$id',
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
      alert('Content updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      alert(`Error updating content: ${error.message}`);
    },
  });

  const handleSave = () => {
    const $ = (window as any).$;
    if ($ && editorRef.current) {
      const content = $(editorRef.current).summernote('code');
      updateMutation.mutate(content);
    }
  };

  const handleBack = () => {
    router.history.back();
  };

  if (isLoading) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className="ms-auto flex items-center space-x-4">
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
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
        <Header>
          <TopNav links={topNav} />
          <div className="ms-auto flex items-center space-x-4">
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
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
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">X-Ray Content Builder</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button variant="default" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </div>

        {/* Receipt Information Card */}
        {xrayData?.invoice_information && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="w-full rounded-xl mx-auto">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Invoice No</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      RPT-{xrayData.invoice_information.id}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Patient Name</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {xrayData.invoice_information.patient_name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Age</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {xrayData.invoice_information.age || '-'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Gender</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {xrayData.invoice_information.sex || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Record Info Card */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              <strong>X-Ray Record ID:</strong> {id}
            </p>
            {xrayData?.test_name && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Test Name:</strong> {xrayData.test_name}
              </p>
            )}
            {xrayData?.test_id && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Test ID:</strong> {xrayData.test_id}
              </p>
            )}
          </CardContent>
        </Card>

        {/* HTML Editor Card */}
        <Card>
          <CardContent className="pt-6">
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
      </Main>
    </>
  );
}

export default XRayBuilder
