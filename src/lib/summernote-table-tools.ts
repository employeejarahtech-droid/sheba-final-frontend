// Table settings widgets for the Summernote editors (custom-tests Additional
// Report Content + the imaging Content Builders). Summernote 0.8 ships only
// the insert-table grid and the row/column popover — width, alignment and
// header styling are added here as custom toolbar dropdowns that operate on
// the table the caret is in (Summernote keeps lastRange, so the table is
// still resolvable right after a toolbar click). Styles are written inline so
// they survive the round-trip through the saved HTML into the print pages.

const HEAD_COLORS: Record<string, string> = {
  Blue: '#3b82f6',
  Green: '#10b981',
  Gray: '#9ca3af',
  Amber: '#f59e0b',
  Red: '#ef4444',
  None: '',
};

// Returns the { tableWidth, tableAlign, tableHead } button factories to pass
// as the `buttons` option of $(el).summernote({...}). Requires jQuery with
// Summernote already loaded ($ must be the same window.$ the editor uses).
export function summernoteTableButtons($: any) {
  // NOTE: do NOT read $.summernote.ui here — summernote-lite only assigns it
  // inside the Context constructor (while .summernote() runs), so it is still
  // undefined while building the options object. Each button factory receives
  // the context at render time; resolve the ui kit from it there.
  const uiOf = (context: any) => context.ui || $.summernote.ui;

  const currentTable = (context: any) => {
    try {
      const range = context.invoke('editor.createRange');
      const node = range && (range.sc || range.ec);
      return node ? $(node).closest('table').get(0) : null;
    } catch (e) {
      return null;
    }
  };

  const withTable = (context: any, apply: (table: HTMLTableElement) => void) => {
    const table = currentTable(context);
    if (!table) {
      window.alert('Click inside a table first, then pick a table setting.');
      return;
    }
    apply(table);
  };

  const dropdown = (label: string, items: string[], apply: (context: any, item: string) => void) =>
    (context: any) => {
      const ui = uiOf(context);
      return ui.buttonGroup([
        ui.button({
          className: 'dropdown-toggle',
          contents: `${label} ▾`,
          tooltip: `Table ${label.toLowerCase()}`,
          data: { toggle: 'dropdown' },
        }),
        ui.dropdown({
          items,
          click: (e: any) => apply(context, $(e.target).text().trim()),
        }),
      ]).render();
    };

  const tableWidth = dropdown('Width', ['100%', '75%', '50%', 'Auto'], (context, w) =>
    withTable(context, (t) => {
      t.style.width = w === 'Auto' ? '' : w;
    })
  );

  const tableAlign = dropdown('Align', ['Center', 'Left'], (context, a) =>
    withTable(context, (t) => {
      const center = a === 'Center';
      t.style.marginLeft = center ? 'auto' : '';
      t.style.marginRight = center ? 'auto' : '';
    })
  );

  const tableHead = dropdown('Head', Object.keys(HEAD_COLORS), (context, name) =>
    withTable(context, (t) => {
      const color = HEAD_COLORS[name];
      $(t).find('tr').first().find('th, td').each(function (this: any) {
        if (color) {
          $(this).css({ backgroundColor: color, color: '#fff', fontWeight: '600' });
        } else {
          $(this).css({ backgroundColor: '', color: '', fontWeight: '' });
        }
      });
    })
  );

  return { tableWidth, tableAlign, tableHead };
}
