import api from '../../axios';

export interface SCurvePoint {
  date: string;
  planned: number;
  actual: number | null;
}

export async function fetchSCurve(projectId: number): Promise<SCurvePoint[]> {
  const { data } = await api.get(`/construction/${projectId}/s-curve`);
  return data;
}
