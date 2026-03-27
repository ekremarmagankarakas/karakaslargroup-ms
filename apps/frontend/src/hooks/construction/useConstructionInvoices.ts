import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInvoice,
  deleteInvoice,
  fetchInvoices,
  markInvoicePaid,
  updateInvoice,
} from '../../api/endpoints/construction/invoices';
import type { InvoiceStatus } from '../../types';

export function useInvoices(projectId: number, status?: InvoiceStatus) {
  return useQuery({
    queryKey: ['construction-invoices', projectId, status],
    queryFn: () => fetchInvoices(projectId, status),
    enabled: !!projectId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createInvoice>[1] }) =>
      createInvoice(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-invoices', projectId] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      invoiceId,
      body,
    }: {
      projectId: number;
      invoiceId: number;
      body: Parameters<typeof updateInvoice>[2];
    }) => updateInvoice(projectId, invoiceId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-invoices', projectId] });
    },
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, invoiceId }: { projectId: number; invoiceId: number }) =>
      markInvoicePaid(projectId, invoiceId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-invoices', projectId] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, invoiceId }: { projectId: number; invoiceId: number }) =>
      deleteInvoice(projectId, invoiceId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-invoices', projectId] });
    },
  });
}
