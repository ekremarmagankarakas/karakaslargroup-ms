import api from '../../axios';
import type { ConstructionSubcontractor, SubcontractorStatus } from '../../../types';

export async function fetchSubcontractors(projectId: number): Promise<ConstructionSubcontractor[]> {
  const { data } = await api.get(`/construction/${projectId}/subcontractors`);
  return data;
}

export async function createSubcontractor(
  projectId: number,
  body: {
    company_name: string;
    trade: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string | null;
    contract_value?: string | null;
    status?: SubcontractorStatus;
    notes?: string | null;
  }
): Promise<ConstructionSubcontractor> {
  const { data } = await api.post(`/construction/${projectId}/subcontractors`, body);
  return data;
}

export async function updateSubcontractor(
  projectId: number,
  subId: number,
  body: {
    company_name?: string;
    trade?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string | null;
    contract_value?: string | null;
    status?: SubcontractorStatus;
    notes?: string | null;
  }
): Promise<ConstructionSubcontractor> {
  const { data } = await api.patch(`/construction/${projectId}/subcontractors/${subId}`, body);
  return data;
}

export async function deleteSubcontractor(projectId: number, subId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/subcontractors/${subId}`);
}
