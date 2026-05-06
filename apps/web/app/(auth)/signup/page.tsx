import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthSocialProof } from "@/components/auth/auth-social-proof";

export const metadata: Metadata = {
  title: "Sign Up - Mentiohunt",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-12 md:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-[480px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "var(--crimson-carrot)", opacity: 0.07 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-64 rounded-full blur-3xl"
          style={{ background: "var(--amber-glow)", opacity: 0.05 }}
        />
        <div className="relative w-full max-w-sm">
          <SignupForm />
        </div>
      </div>

      {/* Social proof side */}
      <AuthSocialProof />
    </main>
  );
}
