import { ShieldAlert, ArrowLeft } from "lucide-react";
export default function UnauthorizedPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-muted/40 via-background to-muted/40 px-4">

      {/* Card */}
      <div className="w-full max-w-lg rounded-3xl border bg-background/80 backdrop-blur-xl shadow-xl p-8 sm:p-10 text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>

        {/* Status */}
        <p className="text-sm font-medium tracking-wide text-destructive uppercase">
          403 Forbidden
        </p>

        {/* Title */}
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Access Restricted
        </h1>

        {/* Description */}
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          You don’t have the required permissions to view this page.
          Please contact your system administrator if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-border" />

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          If this issue persists, please report it to your administrator.
        </p>
      </div>
    </div>
  );
}
