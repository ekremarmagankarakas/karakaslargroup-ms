import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMeetings, createMeeting, updateMeeting, deleteMeeting, toggleMeetingAction } from '../../api/endpoints/construction/meetings';
import type { ConstructionMeetingCreate, ConstructionMeetingUpdate } from '../../types';

export function useMeetings(projectId: number) {
  return useQuery({
    queryKey: ['construction-meetings', projectId],
    queryFn: () => fetchMeetings(projectId),
  });
}

export function useCreateMeeting(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConstructionMeetingCreate) => createMeeting(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-meetings', projectId] }),
  });
}

export function useUpdateMeeting(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, body }: { meetingId: number; body: ConstructionMeetingUpdate }) =>
      updateMeeting(projectId, meetingId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-meetings', projectId] }),
  });
}

export function useDeleteMeeting(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) => deleteMeeting(projectId, meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-meetings', projectId] }),
  });
}

export function useToggleMeetingAction(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, actionId }: { meetingId: number; actionId: number }) =>
      toggleMeetingAction(projectId, meetingId, actionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-meetings', projectId] }),
  });
}
