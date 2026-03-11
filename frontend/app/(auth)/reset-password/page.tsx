'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', token: '', newPassword: '' },
  });

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    if (email) form.setValue('email', email);
    if (token) form.setValue('token', token);
  }, [searchParams, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      resetPassword(values.email, values.token, values.newPassword),
    onSuccess: () => {
      toast.success('Password updated. You can sign in now.');
      router.replace('/login');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const emailFromUrl = Boolean(searchParams.get('email'));
  const tokenFromUrl = Boolean(searchParams.get('token'));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          {emailFromUrl && tokenFromUrl
            ? 'Enter a new password for your account.'
            : 'Enter your email, reset token, and a new password.'}
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        {!emailFromUrl && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        )}
        {!tokenFromUrl && (
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input id="token" {...form.register('token')} />
            {form.formState.errors.token && (
              <p className="text-xs text-destructive">
                {form.formState.errors.token.message}
              </p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              className="pr-10"
              {...form.register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
