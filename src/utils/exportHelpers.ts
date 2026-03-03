// src/utils/exportHelpers.ts

export const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    // 1. Get the headers from the keys of the first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // 2. Add the header row (Capitalize the first letter of each header for neatness)
    csvRows.push(headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(','));

    // 3. Loop over the rows
    for (const row of data) {
        const values = headers.map(header => {
            // Ensure 0s show up, nulls become empty strings
            const rawValue = row[header] === null || row[header] === undefined ? '' : row[header];
            
            // Escape quotes and wrap in quotes to handle commas inside the text
            const escaped = ('' + rawValue).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // 4. Create a Blob (a raw data file)
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 5. Create a hidden invisible link, click it, and destroy it
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
