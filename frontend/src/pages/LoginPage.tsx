import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useLogin } from '../hooks/useApi';
import { extractErrorMessage } from '../api/client';
import { Button } from '../components/ui/Form';
import { Input } from '../components/ui/Form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    login({ email, password }, {
      onError: (err: unknown) => setError(extractErrorMessage(err, 'Login failed')),
      onSuccess: () => navigate('/content'),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your Tongston T-Cell Admin account</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
              required
              autoComplete="email"
              icon={<Mail className="h-5 w-5 text-surface-400" />}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5 text-surface-400" />}
            />

            <Button type="submit" className="w-full" size="lg" loading={isPending}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-surface-50 text-xs text-surface-600">
            <p className="font-medium text-surface-900 mb-1">Test credentials:</p>
            <p className="font-mono">admin@test.com / admin123</p>
            <p className="font-mono">user@test.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}