import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(message || 'Unable to reset password. The link may have expired.');
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
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            {email ? `Setting a new password for ${email}` : 'Enter a new password below.'}
          </p>
        </div>

        {success ? (
          <Alert className="border-brand-success/30 bg-brand-success-bg [&>svg]:text-brand-success">
            <CheckCircle2 className="size-4" />
            <AlertDescription className="text-brand-success-text">
              Password reset successfully. Redirecting you to sign in...
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
              {!token || !email ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    This reset link is missing required information. Please request a new one.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="password">New Password</FieldLabel>
                    <InputGroup className="h-11 rounded-lg">
                      <InputGroupInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(v => !v)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password_confirmation">Confirm Password</FieldLabel>
                    <InputGroup className="h-11 rounded-lg">
                      <InputGroupInput
                        id="password_confirmation"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={e => setPasswordConfirmation(e.target.value)}
                        required
                        minLength={8}
                      />
                    </InputGroup>
                  </Field>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 rounded-lg text-base font-bold"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : 'Reset password'}
                  </Button>
                </>
              )}
            </FieldGroup>
          </form>
        )}

        <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
          <Link to="/login" className="text-sm text-brand-accent hover:text-brand-accent-hover font-medium hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
