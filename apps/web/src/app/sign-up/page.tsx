import { SignUpForm } from '@/components/auth/sign-up-form';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';

export default function SignUpPage() {
  return (
    <AnimatedPageShell className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <SignUpForm />
    </AnimatedPageShell>
  );
}
