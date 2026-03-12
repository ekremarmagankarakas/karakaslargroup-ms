import api from '../api/axios';

/**
 * Fetch a CSV from the given API path and trigger a browser download.
 */
export async function downloadCsv(apiPath: string, filename: string): Promise<void> {
  const response = await api.get(apiPath, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
