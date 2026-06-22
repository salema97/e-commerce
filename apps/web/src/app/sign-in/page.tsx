import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <SignIn routing="hash" />
    </div>
  );
}
