import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';

export default function SignInPage() {
  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
