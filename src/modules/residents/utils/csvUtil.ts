export const toCsv = (rows: Record<string, string>[], headers: string[], label: string[]) => {
  if (rows.length === 0) {
    return label.join(',') + '\r\n';
  }
  const columnNames = label.join(',');
  const lines = rows.map((row) => {
    return headers.map((col) => row[col] ?? '').join(',');
  });
  return [columnNames, ...lines].join('\r\n');
};

export const filenameFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};
