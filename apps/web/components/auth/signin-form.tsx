"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { captureEvent, identifyAnalyticsUser } from "@/lib/analytics";
import { supabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  IconAlertCircle,
  IconLoader2,
  IconShieldCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { IconBrandGoogle } from "../custom-icons/brand-google";
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt";

const signinSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

interface MfaState {
  factorId: string;
  challengeId: string;
}

type Step = "login" | "mfa";

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const is2fa = searchParams.get("2fa") === "1";
  const hasAuthError = searchParams.get("auth_error") === "1";

  const [step, setStep] = useState<Step>(is2fa ? "mfa" : "login");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMfaInitializing, setIsMfaInitializing] = useState(is2fa);
  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  useEffect(() => {
    if (hasAuthError) {
      toast.error("Sign in failed. Please try again.");
    }
    captureEvent("signin_page_viewed", {
      has_mfa_query: is2fa,
    });
  }, [is2fa, hasAuthError]);

  // When arriving via ?2fa=1 (e.g. redirect from middleware), init the challenge
  const initMfaChallenge = useCallback(async () => {
    const supabase = supabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/signin");
      return;
    }

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      !aalData ||
      aalData.currentLevel === "aal2" ||
      aalData.nextLevel !== "aal2"
    ) {
      // MFA already satisfied
      window.location.href = "/dashboard";
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];

    if (!totpFactor) {
      window.location.href = "/dashboard";
      return;
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

    if (challengeError || !challengeData) {
      captureEvent("mfa_challenge_failed", {
        error_message: challengeError?.message,
        source: "signin_query_param",
      });
      toast.error(
        challengeError?.message ??
          "Failed to start MFA challenge. Please sign in again.",
      );
      router.replace("/signin");
      return;
    }

    setMfaState({ factorId: totpFactor.id, challengeId: challengeData.id });
    setIsMfaInitializing(false);
    captureEvent("mfa_challenge_started", {
      source: "signin_query_param",
    });
    captureEvent("mfa_step_viewed", {
      source: "signin_query_param",
    });
  }, [router]);

  useEffect(() => {
    if (is2fa) {
      queueMicrotask(() => {
        void initMfaChallenge();
      });
    }
  }, [is2fa, initMfaChallenge]);

  const goToMfa = (state: MfaState) => {
    setMfaState(state);
    setStep("mfa");
    router.push("/signin?2fa=1");
    captureEvent("mfa_step_viewed", {
      source: "password_signin",
    });
  };

  const goToLogin = () => {
    setStep("login");
    setMfaCode("");
    setMfaError("");
    setMfaState(null);
    router.push("/signin");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEmailLoading(true);

    const formData = {
      email: e.currentTarget.email.value,
      password: e.currentTarget.password.value,
    };

    const validation = signinSchema.safeParse(formData);

    if (!validation.success) {
      captureEvent("signin_validation_failed", {
        method: "email",
        error_count: validation.error.issues.length,
      });
      toast.error(validation.error.issues.map((i) => i.message).join(", "));
      setIsEmailLoading(false);
      return;
    }

    const supabase = supabaseClient();

    captureEvent("signin_started", {
      method: "email",
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      captureEvent("signin_failed", {
        method: "email",
        error_message: error.message,
      });
      toast.error(error.message);
      setIsEmailLoading(false);
      return;
    }

    if (data.user) {
      identifyAnalyticsUser(data.user.id, { email: data.user.email });
    }
    captureEvent("user_signed_in", { method: "email" });

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      aalData?.nextLevel === "aal2" &&
      aalData.nextLevel !== aalData.currentLevel
    ) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (totpFactor) {
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

        if (challengeError || !challengeData) {
          captureEvent("mfa_challenge_failed", {
            error_message: challengeError?.message,
            source: "password_signin",
          });
          toast.error(
            challengeError?.message ?? "Failed to start MFA challenge.",
          );
          setIsEmailLoading(false);
          return;
        }

        goToMfa({ factorId: totpFactor.id, challengeId: challengeData.id });
        setIsEmailLoading(false);
        return;
      }
    }

    window.location.href = "/dashboard";
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaState || code.length !== 6) return;

    setIsEmailLoading(true);
    setMfaError("");

    const supabase = supabaseClient();

    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaState.factorId,
      challengeId: mfaState.challengeId,
      code,
    });

    if (error) {
      captureEvent("mfa_verification_failed", {
        error_message: error.message,
      });
      setMfaError(error.message);
      setMfaCode("");
      setIsEmailLoading(false);
      return;
    }

    captureEvent("mfa_verified");
    window.location.href = "/dashboard";
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = supabaseClient();

    captureEvent("signin_started", {
      method: "google",
    });
    captureEvent("oauth_started", {
      provider: "google",
      flow: "signin",
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      captureEvent("signin_failed", {
        method: "google",
        error_message: error.message,
      });
      toast.error(error.message);
      setIsGoogleLoading(false);
      return;
    }

  };

  const isLoading = isEmailLoading || isGoogleLoading;

  // ── MFA step
  if (step === "mfa") {
    if (isMfaInitializing) {
      return (
        <div
          className={cn("flex flex-col items-center gap-8", className)}
          {...props}
        >
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20"
            style={{ boxShadow: "0 0 28px color-mix(in oklch, var(--crimson-carrot) 22%, transparent)" }}
          >
            <IconBrandMentiohunt className="size-7 text-primary" />
          </div>
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div
        key="mfa"
        className={cn("flex flex-col gap-8", className)}
        {...props}
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center transition-opacity hover:opacity-80">
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20"
            style={{ boxShadow: "0 0 28px color-mix(in oklch, var(--crimson-carrot) 22%, transparent)" }}
          >
            <IconBrandMentiohunt className="size-7 text-primary" />
          </div>
          <span className="sr-only">Mentiohunt</span>
        </Link>

        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconShieldCheck className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Two-factor auth</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field>
            <div className="flex justify-center">
              <Input
                type="text"
                value={mfaCode}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                onChange={(value) => {
                  const nextValue = value.currentTarget.value.replace(/\D/g, "");
                  setMfaCode(nextValue);
                  if (nextValue.length === 6) {
                    handleMfaVerify(nextValue);
                  }
                }}
                disabled={isEmailLoading}
                autoFocus
                className="max-w-48 text-center text-lg font-medium tracking-[0.4em]"
              />
            </div>
          </Field>

          {mfaError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <IconAlertCircle className="size-4 shrink-0" />
              {mfaError}
            </p>
          )}

          <Field>
            <Button
              type="button"
              variant="animated"
              disabled={isEmailLoading || mfaCode.length !== 6}
              onClick={() => handleMfaVerify(mfaCode)}
              className="w-full"
            >
              {isEmailLoading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : null}
              Verify &amp; continue
            </Button>
          </Field>

          <button
            type="button"
            onClick={goToLogin}
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to sign in
          </button>
        </FieldGroup>
      </div>
    );
  }

  // ── Login step
  return (
    <div
      key="login"
      className={cn("flex flex-col gap-8", className)}
      {...props}
    >
      {/* Logo */}
      <Link href="/" className="flex justify-center transition-opacity hover:opacity-80">
        <div
          className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20"
          style={{ boxShadow: "0 0 28px color-mix(in oklch, var(--crimson-carrot) 22%, transparent)" }}
        >
          <IconBrandMentiohunt className="size-7 text-primary" />
        </div>
        <span className="sr-only">Mentiohunt</span>
      </Link>

      {/* Heading */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back.</h1>
        <p className="text-sm text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              disabled={isLoading}
              className="transition-opacity disabled:opacity-50"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              disabled={isLoading}
              className="transition-opacity disabled:opacity-50"
            />
          </Field>
          <Field>
            <Button
              type="submit"
              variant="animated"
              disabled={isLoading}
              className="w-full relative"
            >
              {isEmailLoading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : null}
              Sign In
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="flex gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full transition-all hover:bg-accent"
            >
              {isGoogleLoading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconBrandGoogle className="size-4" />
              )}
              {isGoogleLoading ? "Connecting…" : "Continue with Google"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="text-center text-xs text-muted-foreground/70">
        By continuing, you agree to our{" "}
        <Link href="/privacy" className="underline-offset-4 hover:underline hover:text-foreground">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="underline-offset-4 hover:underline hover:text-foreground">
          Terms of Service
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
