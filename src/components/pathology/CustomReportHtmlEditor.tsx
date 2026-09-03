import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { summernoteTableButtons } from "@/lib/summernote-table-tools";

export interface CustomReportHtmlEditorHandle {
  getContent: () => string;
}

interface CustomReportHtmlEditorProps {
  // The saved HTML to seed the editor with once it's ready to initialize.
  // Only applied once (Summernote is an uncontrolled/imperative editor —
  // matches the pattern already used by the x-ray/ultrasonogram/ecg content
  // builders in this app).
  initialValue?: string;
  // Don't initialize until the parent's own data (and therefore
  // initialValue) has actually loaded — avoids seeding with a stale/blank
  // value before the real content arrives.
  ready: boolean;
}

const SUMMERNOTE_CSS = 'https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css';
const JQUERY_JS = 'https://code.jquery.com/jquery-3.6.0.min.js';
const SUMMERNOTE_JS = 'https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js';

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      (script as any)._loaded = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function loadCssOnce(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Custom result-entry "Additional Report Content" editor — a rich-text
// (Summernote) field whose HTML is embedded into result_text alongside the
// rest of the custom test's data (see LegacyCustomTestForm/DynamicCustomTestForm)
// and rendered as-is on the print page. Applies to every custom report
// format (legacy free-form rows and template-driven forms alike).
export const CustomReportHtmlEditor = forwardRef<CustomReportHtmlEditorHandle, CustomReportHtmlEditorProps>(
  ({ initialValue, ready }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [libsLoaded, setLibsLoaded] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
      loadCssOnce(SUMMERNOTE_CSS);
      loadScriptOnce(JQUERY_JS)
        .then(() => loadScriptOnce(SUMMERNOTE_JS))
        .then(() => setLibsLoaded(true))
        .catch(() => setLibsLoaded(false));
    }, []);

    useEffect(() => {
      if (!libsLoaded || !ready || !editorRef.current || initialized) return;
      const $ = (window as any).$;
      if (!$ || !$.fn?.summernote) return;

      $(editorRef.current).summernote({
        height: 300,
        buttons: summernoteTableButtons($),
        toolbar: [
          ['style', ['style']],
          ['font', ['bold', 'italic', 'underline', 'clear']],
          ['fontsize', ['fontsize']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['insert', ['link', 'hr', 'table']],
          ['table-tools', ['tableWidth', 'tableAlign', 'tableHead']],
          ['view', ['fullscreen', 'codeview']],
        ],
        placeholder: 'Add any additional report content here (optional)...',
        callbacks: {
          onInit: () => {
            setInitialized(true);
            if (initialValue) {
              $(editorRef.current).summernote('code', initialValue);
            }
          },
        },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [libsLoaded, ready, initialized]);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        const $ = (window as any).$;
        if ($ && editorRef.current) {
          try {
            return $(editorRef.current).summernote('code') || '';
          } catch (e) {
            return '';
          }
        }
        return '';
      },
    }));

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div ref={editorRef} />
        {!libsLoaded && (
          <p className="p-3 text-sm text-muted-foreground">Loading editor...</p>
        )}
      </div>
    );
  }
);
CustomReportHtmlEditor.displayName = 'CustomReportHtmlEditor';
