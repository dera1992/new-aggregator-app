'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { fetchAdminUsers, updateUserRole } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_OPTIONS = ['user', 'admin'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleOverrides, setRoleOverrides] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: (response) => {
      toast.success('Role updated');
      queryClient.setQueryData(['admin-users'], (current: typeof data) => {
        if (!current) {
          return current;
        }
        return {
          users: current.users.map((user) =>
            user.id === response.user_id ? { ...user, role: response.role } : user,
          ),
        };
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const users = useMemo(() => data?.users ?? [], [data]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin user management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const selectedRole = roleOverrides[user.id] ?? user.role;
                return (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        ID {user.id} · {user.is_email_confirmed ? 'Confirmed' : 'Unconfirmed'} ·{' '}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedRole}
                        onValueChange={(value) =>
                          setRoleOverrides((prev) => ({ ...prev, [user.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                          {!ROLE_OPTIONS.includes(selectedRole) && (
                            <SelectItem value={selectedRole}>{selectedRole}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => mutation.mutate({ userId: user.id, role: selectedRole })}
                        disabled={mutation.isPending || selectedRole === user.role}
                      >
                        {mutation.isPending ? 'Saving...' : 'Update role'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
