// Shared font-size options for pathology report print pages — same 4 named
// sizes/zoom values as the outdoor invoice's Print Settings "Font Size"
// dropdown (sheba-frontend/src/routes/.../outdoor/reception/invoices/$invoiceId/index.tsx).
// Applied via CSS `zoom` on the report's outer wrapper, same technique as
// the invoice page: most report cells use Tailwind text-size utilities
// (explicit rem font-size, no inheritance), so `zoom` scales everything
// (text, padding, borders) uniformly instead of needing to override every
// element's own font size.
export const FONT_SIZE_OPTIONS: Record<string, { label: string; zoom: number }> = {
  sm: { label: 'Small', zoom: 0.85 },
  base: { label: 'Medium', zoom: 1 },
  lg: { label: 'Large', zoom: 1.15 },
  xl: { label: 'Extra Large', zoom: 1.3 },
};

export type FontSizeKey = keyof typeof FONT_SIZE_OPTIONS;
export const DEFAULT_FONT_SIZE: FontSizeKey = 'base';
