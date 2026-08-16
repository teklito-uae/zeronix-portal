import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';

export const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/admin/forgot-password', { email });
      // Always show a generic success message, regardless of whether the
      // email is registered, so we don't leak account existence.
      setSent(true);
    } catch (err) {
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-primary">
            Forgot password?
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        {sent ? (
          <Alert className="border-brand-success/30 bg-brand-success-bg [&>svg]:text-brand-success">
            <CheckCircle2 className="size-4" />
            <AlertDescription className="text-brand-success-text">
              If an account exists for that email, a password reset link has been sent. Check your inbox.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@zeronix.com"
                  required
                  className="h-11 rounded-lg"
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                className="w-full h-11 rounded-lg text-base font-bold"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Send reset link'}
              </Button>
            </FieldGroup>
          </form>
        )}

        <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:text-brand-accent-hover font-medium hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
