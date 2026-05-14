import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
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
import { Printer } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/_authenticated/ultrasonogram/all/edit/builder/$id',
)({
  component: UltrasonogramBuilder,
})

function UltrasonogramBuilder() {
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

  // Fetch Ultrasonogram record data
  const { data: ultrasonogramData, isLoading } = useQuery({
    queryKey: ["ultrasonogram-record", id],
    queryFn: async () => {
      const numericId = parseInt(id, 10);
      console.log('Fetching Ultrasonogram data for ID:', numericId, 'Type:', typeof numericId);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/builder/${numericId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch Ultrasonogram data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      console.log('Fetched Ultrasonogram data:', json.data);
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize Summernote when data and library are loaded
  useEffect(() => {
    if (summernoteInitialized && editorRef.current && ultrasonogramData && !editorReady) {
      const $ = (window as any).$;
      if ($) {
        console.log('Initializing Summernote...');
        console.log('Ultrasonogram data:', ultrasonogramData);
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
                  console.log('Setting initial content:', ultrasonogramData.test_result);
                  if (ultrasonogramData.test_result) {
                    $(editorRef.current).summernote('code', ultrasonogramData.test_result);
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
  }, [summernoteInitialized, ultrasonogramData, editorReady]);

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      console.log('Saving content for ID:', id, 'Type:', typeof id);
      console.log('Content length:', newContent?.length || 0);

      const numericId = parseInt(id, 10);
      console.log('Numeric ID:', numericId, 'Type:', typeof numericId);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${numericId}`,
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
        throw new Error(`Failed to update Ultrasonogram record (${res.status}): ${errorText}`);
      }

      const result = await res.json();
      console.log('Update successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ultrasonogram-record", id] });
      queryClient.invalidateQueries({ queryKey: ["ultrasonogram-invoice"] });
      queryClient.invalidateQueries({ queryKey: ["ultrasonogram-all"] });
      toast.success('Content updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast.error(`Error updating content: ${error.message}`);
    },
  });

  const handleSave = () => {
    const $ = (window as any).$;
    console.log('handleSave called');
    console.log('jQuery available:', !!$);
    console.log('editorRef.current:', editorRef.current);

    if ($) {
      console.log('jQuery is available');
      if (editorRef.current) {
        console.log('editorRef.current exists');
        try {
          const content = $(editorRef.current).summernote('code');
          console.log('Content retrieved:', content?.substring(0, 100));
          updateMutation.mutate(content);
        } catch (error) {
          console.error('Error getting content from Summernote:', error);
          toast.error('Error getting content from editor. Please try again.');
        }
      } else {
        console.error('editorRef.current is null');
        toast.error('Editor not ready. Please wait a moment and try again.');
      }
    } else {
      console.error('jQuery not available');
      toast.error('Editor not loaded properly. Please refresh the page.');
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
          <h1 className="text-2xl font-bold tracking-tight">Ultrasonogram Content Builder</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Link to="/ultrasonogram/all/print/$id" params={{ id }}>
              <Button variant="outline" onClick={(e) => {
                e.preventDefault();
                router.navigate({ to: '/ultrasonogram/all/print/$id', params: { id } });
              }}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </Link>
            <Button variant="default" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </div>

        {/* Receipt Information Card */}
        {ultrasonogramData?.invoice_information && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="w-full rounded-xl mx-auto">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Invoice No</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      RPT-{ultrasonogramData.invoice_information.id}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Patient Name</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {ultrasonogramData.invoice_information.patient_name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Age</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {ultrasonogramData.invoice_information.age || '-'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Gender</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                      {ultrasonogramData.invoice_information.sex || '-'}
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
              <strong>Ultrasonogram Record ID:</strong> {id}
            </p>
            {ultrasonogramData?.test_name && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Test Name:</strong> {ultrasonogramData.test_name}
              </p>
            )}
            {ultrasonogramData?.test_id && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Test ID:</strong> {ultrasonogramData.test_id}
              </p>
            )}
          </CardContent>
        </Card>

        {/* HTML Editor Card */}
        <Card>
          <CardContent className="pt-2">
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

export default UltrasonogramBuilder
