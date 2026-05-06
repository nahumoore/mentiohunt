"use client";

import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { captureEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  IconAlertTriangle,
  IconLoader2,
  IconMailCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt";

export function ConfirmView({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const [isLoading, setIsLoading] = useState(false);

  const isValid = !!tokenHash && !!type;
  const isSignup = type === "signup";

  useEffect(() => {
    captureEvent("email_confirmation_viewed", {
      is_valid: isValid,
      type,
    });
  }, [isValid, type]);

  const handleConfirm = () => {
    if (!isValid) return;

    captureEvent("email_confirmation_started", {
      type,
    });

    setIsLoading(true);
    window.location.href = `/api/auth/verify-otp?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBrandMentiohunt className="size-6 text-primary" />
            </div>
          </Link>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "flex size-16 items-center justify-center rounded-2xl",
              isValid
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isValid ? (
              <IconMailCheck className="size-8" />
            ) : (
              <IconAlertTriangle className="size-8" />
            )}
          </motion.div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {isValid
                ? isSignup
                  ? "Confirm your account"
                  : "Log in to Mentiohunt"
                : "Link expired"}
            </h1>
            <FieldDescription className="text-muted-foreground max-w-xs mx-auto">
              {isValid
                ? isSignup
                  ? "Click below to verify your email and activate your account."
                  : "Click below to complete your sign in."
                : "This link has already been used or has expired. Please request a new one."}
            </FieldDescription>
          </div>
        </div>

        {isValid ? (
          <Button
            type="button"
            variant="animated"
            disabled={isLoading}
            onClick={handleConfirm}
            className="w-full"
          >
            {isLoading ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : null}
            {isSignup ? "Confirm your account" : "Log in"}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/signin">Back to sign in</Link>
          </Button>
        )}
      </FieldGroup>
    </div>
  );
}
