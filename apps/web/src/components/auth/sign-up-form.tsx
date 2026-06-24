'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuthUser } from '@repo/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { formatApiError } from '@/lib/api-error';

type SignUpState = {
  name: string;
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
};

type SignUpAction =
  | { type: 'set_field'; field: 'name' | 'email' | 'password'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_error'; message: string }
  | { type: 'submit_end' };

const signUpInitialState: SignUpState = {
  name: '',
  email: '',
  password: '',
  error: null,
  loading: false,
};

function signUpReducer(state: SignUpState, action: SignUpAction): SignUpState {
  switch (action.type) {
    case 'set_field':
      return { ...state, [action.field]: action.value };
    case 'submit_start':
      return { ...state, loading: true, error: null };
    case 'submit_error':
      return { ...state, loading: false, error: action.message };
    case 'submit_end':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function SignUpForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [state, dispatch] = React.useReducer(signUpReducer, signUpInitialState);
  const { name, email, password, error, loading } = state;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    dispatch({ type: 'submit_start' });

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      dispatch({ type: 'submit_error', message: formatApiError(body, 'No se pudo crear la cuenta') });
      return;
    }

    const data = (await res.json()) as { user: AuthUser; accessToken: string };
    setSession(data.user, data.accessToken);

    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="space-y-2 text-center">
        <h1 className="neo-page-title">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">Regístrate para comprar y seguir tus pedidos</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => dispatch({ type: 'set_field', field: 'name', value: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => dispatch({ type: 'set_field', field: 'email', value: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => dispatch({ type: 'set_field', field: 'password', value: e.target.value })}
          minLength={8}
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? 'Creando…' : 'Registrarse'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
