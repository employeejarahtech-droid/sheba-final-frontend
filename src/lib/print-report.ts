export interface PrintColumn {
  header: string
  field?: string
  render?: (row: any) => string
  align?: 'left' | 'center' | 'right'
}

export interface PrintStat {
  label: string
  value: string | number
  color?: string
}

export interface PrintFilter {
  label: string
  value: string
}

export interface PrintReportOptions {
  title: string
  subtitle?: string
  stats?: PrintStat[]
  columns: PrintColumn[]
  data: any[]
  filters?: PrintFilter[]
  totalCount?: number
  hospitalName?: string
  hospitalAddress?: string
}

const STAT_COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '-'
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim() || '-'
}

export function printReport(options: PrintReportOptions): void {
  const {
    title,
    subtitle,
    stats = [],
    columns,
    data,
    filters = [],
    totalCount,
    hospitalName = 'Sheba Hospital',
    hospitalAddress = 'Dhaka, Bangladesh',
  } = options

  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const statsHtml = stats.length
    ? `<div class="stats-grid">
        ${stats.map((s, i) => `
          <div class="stat-card" style="border-left: 4px solid ${s.color || STAT_COLORS[i % 6]}">
            <div class="stat-label">${escapeHtml(s.label)}</div>
            <div class="stat-value" style="color:${s.color || STAT_COLORS[i % 6]}">${escapeHtml(s.value)}</div>
          </div>`).join('')}
       </div>`
    : ''

  const filtersHtml = filters.filter(f => f.value).length
    ? `<div class="filters-bar">
        <strong>Filters applied:</strong>
        ${filters.filter(f => f.value).map(f => `<span class="filter-tag">${escapeHtml(f.label)}: <em>${escapeHtml(f.value)}</em></span>`).join('')}
       </div>`
    : ''

  const theadHtml = `<thead><tr>${columns.map(c =>
    `<th style="text-align:${c.align || 'left'}">${escapeHtml(c.header)}</th>`
  ).join('')}</tr></thead>`

  const tbodyHtml = `<tbody>${data.map((row, ri) =>
    `<tr class="${ri % 2 === 0 ? '' : 'alt'}">
      ${columns.map(c => {
        let val = '-'
        if (c.render) {
          try { val = stripHtml(String(c.render(row))) } catch { val = '-' }
        } else if (c.field) {
          val = escapeHtml(row[c.field] ?? '-')
        }
        return `<td style="text-align:${c.align || 'left'}">${val}</td>`
      }).join('')}
    </tr>`
  ).join('')}</tbody>`

  const recordsNote = totalCount != null
    ? `Showing ${data.length} of ${totalCount} total records`
    : `${data.length} records`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} — ${escapeHtml(hospitalName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; }

  /* ── HEADER ── */
  .report-header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 16px; }
  .hospital-name { font-size: 20pt; font-weight: 700; letter-spacing: 0.5px; color: #0f172a; }
  .hospital-address { font-size: 9pt; color: #64748b; margin-top: 3px; }
  .report-title-box { display: inline-block; border: 1.5px solid #334155; border-radius: 4px; padding: 5px 24px; margin-top: 10px; }
  .report-title { font-size: 13pt; font-weight: 600; color: #1e293b; }
  .report-subtitle { font-size: 9pt; color: #64748b; margin-top: 2px; }

  /* ── META ROW ── */
  .meta-row { display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt; color: #64748b; margin-bottom: 12px; padding: 0 2px; }
  .records-count { font-weight: 500; color: #334155; }

  /* ── FILTERS ── */
  .filters-bar { font-size: 8.5pt; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 10px; margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .filter-tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 10px; }

  /* ── STATS ── */
  .stats-grid { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .stat-card { flex: 1; min-width: 110px; background: #f8fafc; border-radius: 6px; padding: 10px 14px; border-left: 4px solid #10B981; }
  .stat-label { font-size: 8pt; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
  .stat-value { font-size: 15pt; font-weight: 700; color: #10B981; margin-top: 3px; line-height: 1; }

  /* ── TABLE ── */
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead tr { background: #1e293b; }
  th { color: #ffffff; font-size: 8.5pt; font-weight: 600; padding: 8px 10px; text-align: left; letter-spacing: 0.2px; }
  td { font-size: 9pt; padding: 7px 10px; border-bottom: 0.5px solid #e2e8f0; color: #334155; vertical-align: middle; word-break: break-word; }
  tr.alt td { background: #f8fafc; }
  tr:last-child td { border-bottom: none; }

  /* ── FOOTER ── */
  .report-footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 7.5pt; color: #94a3b8; }

  /* ── PRINT ── */
  @page { size: A4; margin: 12mm 14mm 14mm 14mm; }
  @page :first { margin-top: 10mm; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .stat-card { page-break-inside: avoid; }
</style>
</head>
<body>

<div class="report-header">
  <div class="hospital-name">${escapeHtml(hospitalName)}</div>
  <div class="hospital-address">${escapeHtml(hospitalAddress)}</div>
  <div class="report-title-box">
    <div class="report-title">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="report-subtitle">${escapeHtml(subtitle)}</div>` : ''}
  </div>
</div>

<div class="meta-row">
  <span class="records-count">${recordsNote}</span>
  <span>Generated: ${now}</span>
</div>

${filtersHtml}
${statsHtml}

<table>
  ${theadHtml}
  ${tbodyHtml}
</table>

<div class="report-footer">
  <span>${escapeHtml(hospitalName)} — Confidential</span>
  <span>${escapeHtml(title)} | ${now}</span>
</div>

<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.history.back(); };
  };
</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print reports.')
    return
  }
  win.document.write(html)
  win.document.close()
}
