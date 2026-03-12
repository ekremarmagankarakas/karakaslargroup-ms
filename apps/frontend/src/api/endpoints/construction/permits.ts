import api from '../../axios';
import type { ConstructionPermit, PermitStatus, PermitType } from '../../../types';

export async function fetchPermits(projectId: number): Promise<ConstructionPermit[]> {
  const { data } = await api.get(`/construction/${projectId}/permits`);
  return data;
}

export async function createPermit(
  projectId: number,
  body: {
    permit_type: PermitType;
    permit_number?: string | null;
    issuing_authority: string;
    status?: PermitStatus;
    applied_date?: string | null;
    approved_date?: string | null;
    expiry_date?: string | null;
    notes?: string | null;
  }
): Promise<ConstructionPermit> {
  const { data } = await api.post(`/construction/${projectId}/permits`, body);
  return data;
}

export async function updatePermit(
  projectId: number,
  permitId: number,
  body: {
    permit_type?: PermitType;
    permit_number?: string | null;
    issuing_authority?: string;
    status?: PermitStatus;
    applied_date?: string | null;
    approved_date?: string | null;
    expiry_date?: string | null;
    notes?: string | null;
  }
): Promise<ConstructionPermit> {
  const { data } = await api.patch(`/construction/${projectId}/permits/${permitId}`, body);
  return data;
}

export async function deletePermit(projectId: number, permitId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/permits/${permitId}`);
}
