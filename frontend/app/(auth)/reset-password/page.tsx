'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { resetPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(4),
  newPassword: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', token: '', newPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      resetPassword(values.email, values.token, values.newPassword),
    onSuccess: () => toast.success('Password updated. You can sign in now.'),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the reset token and a new password.
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" {...form.register('token')} />
          {form.formState.errors.token && (
            <p className="text-xs text-destructive">
              {form.formState.errors.token.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" {...form.register('newPassword')} />
          {form.formState.errors.newPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Updating...' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
