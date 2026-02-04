import { apiFetch } from '@/lib/api/client';

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_email_confirmed: boolean;
};

export type AdminUsersResponse = {
  users: AdminUser[];
};

export function fetchAdminUsers() {
  return apiFetch<AdminUsersResponse>('/api/admin/users');
}

export function updateUserRole(userId: number, role: string) {
  return apiFetch<{ message: string; user_id: number; role: string }>(
    `/api/admin/users/${userId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );
}
