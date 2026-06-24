import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';

export default function SignInPage() {
  return (
    <AnimatedPageShell className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AnimatedPageShell>
  );
}
