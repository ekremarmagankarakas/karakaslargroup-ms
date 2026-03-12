import api from '../../axios';
import type { ConstructionInvoice, InvoiceStatus } from '../../../types';

export async function fetchInvoices(projectId: number, status?: InvoiceStatus): Promise<ConstructionInvoice[]> {
  const { data } = await api.get(`/construction/${projectId}/invoices`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function fetchOverdueInvoices(): Promise<ConstructionInvoice[]> {
  const { data } = await api.get('/construction/invoices/overdue');
  return data;
}

export async function createInvoice(
  projectId: number,
  body: {
    invoice_number: string;
    description: string;
    amount: string;
    tax_amount?: string;
    invoice_date: string;
    due_date?: string;
    subcontractor_id?: number;
    notes?: string;
  },
): Promise<ConstructionInvoice> {
  const { data } = await api.post(`/construction/${projectId}/invoices`, body);
  return data;
}

export async function updateInvoice(
  projectId: number,
  invoiceId: number,
  body: Partial<{
    invoice_number: string;
    description: string;
    amount: string;
    tax_amount: string;
    status: InvoiceStatus;
    invoice_date: string;
    due_date: string | null;
    notes: string | null;
  }>,
): Promise<ConstructionInvoice> {
  const { data } = await api.patch(`/construction/${projectId}/invoices/${invoiceId}`, body);
  return data;
}

export async function markInvoicePaid(projectId: number, invoiceId: number): Promise<ConstructionInvoice> {
  const { data } = await api.post(`/construction/${projectId}/invoices/${invoiceId}/pay`);
  return data;
}

export async function deleteInvoice(projectId: number, invoiceId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/invoices/${invoiceId}`);
}
