import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, createUser, fetchUsers } from '../api/endpoints/users';
import type { UserRole } from '../types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; email: string; password: string; role: UserRole }) =>
      createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string; confirm_password: string }) =>
      changePassword(data),
  });
}
