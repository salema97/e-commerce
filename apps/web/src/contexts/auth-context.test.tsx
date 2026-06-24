import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

function SessionProbe() {
  const { user, accessToken } = useAuth();
  return (
    <div>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="token">{accessToken ? 'present' : 'missing'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores user and access token from /api/auth/me', async () => {
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
          accessToken: 'test-access-token',
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
      expect(getByTestId('token').textContent).toBe('present');
    });
  });
});
