// Shared column-width presets for pathology report results tables,
// switchable from a report's Print Settings drawer. 'two' hides the Normal
// Range column entirely. Same technique as print-font-size.ts.
export type ColumnLayoutKey = 'default' | 'equal3' | 'two' | 'wide3';

export const COLUMN_LAYOUT_OPTIONS: Record<
  ColumnLayoutKey,
  { label: string; widths: { name: number; result: number; range: number | null } }
> = {
  default: { label: 'Default (40 / 30 / 30)', widths: { name: 40, result: 30, range: 30 } },
  equal3: { label: '3 Column — 33.33 / 33.33 / 33.33', widths: { name: 33.33, result: 33.33, range: 33.33 } },
  two: { label: '2 Column — 50 / 50 (No Normal Range)', widths: { name: 50, result: 50, range: null } },
  wide3: { label: '3 Column — 35 / 25 / 40', widths: { name: 35, result: 25, range: 40 } },
};

export const DEFAULT_COLUMN_LAYOUT: ColumnLayoutKey = 'default';
