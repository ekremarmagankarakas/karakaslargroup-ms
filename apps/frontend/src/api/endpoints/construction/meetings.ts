import api from '../../axios';
import type { ConstructionMeeting, ConstructionMeetingCreate, ConstructionMeetingUpdate, MeetingActionResponse } from '../../../types';

export async function fetchMeetings(projectId: number): Promise<ConstructionMeeting[]> {
  const { data } = await api.get(`/construction/${projectId}/meetings`);
  return data;
}

export async function createMeeting(projectId: number, body: ConstructionMeetingCreate): Promise<ConstructionMeeting> {
  const { data } = await api.post(`/construction/${projectId}/meetings`, body);
  return data;
}

export async function updateMeeting(projectId: number, meetingId: number, body: ConstructionMeetingUpdate): Promise<ConstructionMeeting> {
  const { data } = await api.patch(`/construction/${projectId}/meetings/${meetingId}`, body);
  return data;
}

export async function deleteMeeting(projectId: number, meetingId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/meetings/${meetingId}`);
}

export async function toggleMeetingAction(projectId: number, meetingId: number, actionId: number): Promise<MeetingActionResponse> {
  const { data } = await api.post(`/construction/${projectId}/meetings/${meetingId}/actions/${actionId}/toggle`);
  return data;
}
