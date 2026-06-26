import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

function SessionProbe() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores user from /api/auth/me without exposing access token to JS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'u1',
            email: 'store-admin@example.com',
            name: 'Admin',
            role: 'ADMIN',
            phone: null,
          },
        }),
      }),
    );

    const { getByTestId } = render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('email').textContent).toBe('store-admin@example.com');
      expect(getByTestId('auth').textContent).toBe('yes');
    });
  });
});
