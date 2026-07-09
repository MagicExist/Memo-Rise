import { Suspense } from "react";

import { LoginForm } from "@/components/features/auth/LoginForm";

// LoginForm reads `redirectTo` via useSearchParams — wrap in Suspense per Next.js App Router.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
