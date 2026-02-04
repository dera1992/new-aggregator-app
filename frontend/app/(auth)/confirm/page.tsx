'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import { confirmAccount, resendConfirmation } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(4),
});

type FormValues = z.infer<typeof schema>;

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const hasAutoSubmitted = useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', token: '' },
  });

  const confirmMutation = useMutation({
    mutationFn: (values: FormValues) => confirmAccount(values.email, values.token),
    onSuccess: () => toast.success('Account confirmed. You can sign in now.'),
    onError: (error: Error) => toast.error(error.message),
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => resendConfirmation(email),
    onSuccess: () => toast.success('Confirmation email resent.'),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    if (!email || !token) {
      return;
    }

    form.setValue('email', email);
    form.setValue('token', token);

    if (!hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      confirmMutation.mutate({ email, token });
    }
  }, [searchParams, form, confirmMutation]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Confirm account</h1>
        <p className="text-sm text-muted-foreground">
          Use the confirmation link in your email or enter the token below.
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit((values) => confirmMutation.mutate(values))}
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
          <Label htmlFor="token">Confirmation token</Label>
          <Input id="token" {...form.register('token')} />
          {form.formState.errors.token && (
            <p className="text-xs text-destructive">
              {form.formState.errors.token.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={confirmMutation.isPending}>
          {confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => resendMutation.mutate(form.getValues('email'))}
        disabled={resendMutation.isPending}
      >
        {resendMutation.isPending ? 'Resending...' : 'Resend confirmation email'}
      </Button>
    </div>
  );
}
