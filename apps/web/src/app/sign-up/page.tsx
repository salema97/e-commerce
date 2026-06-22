import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <SignUp routing="hash" />
    </div>
  );
}
