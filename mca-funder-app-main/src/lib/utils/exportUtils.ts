import * as XLSX from 'xlsx';


// export excel file with both label and key in Excel format
export function exportExcel(
  rows: Record<string, any>[],
  columns: { key: string; label: string }[],
  filename = 'export.xlsx'
) {
  if (rows.length === 0) return;

  // Build rows: include column labels as headers
  const excelData = [
    columns.map(c => `${c.label} (${c.key})`), // header row with both label + key
    ...rows.map(row =>
      columns.map(col => row[col.key] ?? '')
    )
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, filename);
}


// export csv file with both label and key in CSV format
export function exportCSV(rows: Record<string, any>[], columns: { key: string; label: string }[], filename = 'export.csv') {
    if (rows.length === 0) return;

    const header = columns.map(c => `${c.label} (${c.key})`); // header row with both label + key
    const csvRows = [
        header.join(','),
        ...rows.map(row =>
            columns.map(col => {
                const cell = row[col.key];
                const safe = String(cell ?? '').replace(/"/g, '""');
                return `"${safe}"`;
            }).join(',')
        ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}