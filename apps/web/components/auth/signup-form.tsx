"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { captureEvent, identifyAnalyticsUser } from "@/lib/analytics";
import { supabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { IconLoader2, IconMailCheck } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { IconBrandGoogle } from "../custom-icons/brand-google";
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt";

const signupSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    captureEvent("signup_page_viewed");
  }, []);

  useEffect(() => {
    if (!accountCreated) return;
    captureEvent("signup_confirmation_prompt_shown", { method: "email" });
  }, [accountCreated]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEmailLoading(true);

    const formData = {
      email: e.currentTarget.email.value,
      password: e.currentTarget.password.value,
    };

    const validation = signupSchema.safeParse(formData);

    if (!validation.success) {
      captureEvent("signup_validation_failed", {
        method: "email",
        error_count: validation.error.issues.length,
      });
      const errors = validation.error.issues.map((err) => err.message).join(", ");
      toast.error(errors);
      setIsEmailLoading(false);
      return;
    }

    const supabase = supabaseClient();

    captureEvent("signup_started", { method: "email" });

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      captureEvent("signup_failed", {
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

    captureEvent("user_signed_up", { method: "email", email: formData.email });

    setUserEmail(formData.email);
    setAccountCreated(true);
    setIsEmailLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = supabaseClient();

    captureEvent("signup_started", { method: "google" });
    captureEvent("oauth_started", { provider: "google", flow: "signup" });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      captureEvent("signup_failed", {
        method: "google",
        error_message: error.message,
      });
      toast.error(error.message);
      setIsGoogleLoading(false);
      return;
    }
  };

  const isLoading = isEmailLoading || isGoogleLoading;

  if (accountCreated) {
    return (
      <div
        className={cn("flex flex-col items-center gap-8 text-center", className)}
        {...props}
      >
        <Link href="/" className="transition-opacity hover:opacity-80">
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20"
            style={{
              boxShadow:
                "0 0 28px color-mix(in oklch, var(--crimson-carrot) 22%, transparent)",
            }}
          >
            <IconBrandMentiohunt className="size-7 rotate-12 text-primary" />
          </div>
          <span className="sr-only">Mentiohunt</span>
        </Link>

        <div className="flex flex-col items-center gap-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <IconMailCheck className="size-8" />
          </motion.div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Check your inbox
            </h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              Confirmation link sent to{" "}
              <span className="font-medium text-foreground">{userEmail}</span>.
              Click it to activate your account.
            </p>
          </div>

          <FieldDescription className="text-xs text-muted-foreground/70">
            No email? Check spam or{" "}
            <button
              type="button"
              onClick={() => setAccountCreated(false)}
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              try again
            </button>
            .
          </FieldDescription>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <Link
        href="/"
        className="flex justify-center transition-opacity hover:opacity-80"
      >
        <div
          className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20"
          style={{
            boxShadow:
              "0 0 28px color-mix(in oklch, var(--crimson-carrot) 22%, transparent)",
          }}
        >
          <IconBrandMentiohunt className="size-7 rotate-12 text-primary" />
        </div>
        <span className="sr-only">Mentiohunt</span>
      </Link>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Find backlinks daily.
        </h1>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
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
              placeholder="At least 8 characters"
              required
              disabled={isLoading}
              className="transition-opacity disabled:opacity-50"
            />
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full relative"
            >
              {isEmailLoading ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Creating account&hellip;
                </>
              ) : (
                "Create Account"
              )}
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
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Connecting&hellip;
                </>
              ) : (
                <>
                  <IconBrandGoogle className="size-4" />
                  Continue with Google
                </>
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="text-center text-xs text-muted-foreground/70">
        By continuing, you agree to our{" "}
        <Link
          href="/privacy"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          Terms of Service
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
