"use client";

import { FieldGroup } from "@workspace/ui/components/field";
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
import { useEffect, useRef } from "react";
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt";

export function ConfirmView({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const isValid = !!tokenHash && !!type;
  const navigated = useRef(false);

  useEffect(() => {
    if (!isValid || navigated.current) return;
    navigated.current = true;

    captureEvent("email_confirmation_started", { type });

    window.location.href = `/api/auth/verify-otp?token_hash=${encodeURIComponent(tokenHash!)}&type=${encodeURIComponent(type!)}`;
  }, [isValid, tokenHash, type]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBrandMentiohunt className="size-6 rotate-12 text-primary" />
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
              <IconLoader2 className="size-8 animate-spin" />
            ) : (
              <IconAlertTriangle className="size-8" />
            )}
          </motion.div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {isValid ? "Verifying your email…" : "Link expired"}
            </h1>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              {isValid
                ? "Hold tight, this only takes a second."
                : "This link has already been used or has expired. Please request a new one."}
            </p>
          </div>
        </div>

        {!isValid && (
          <Link
            href="/signin"
            className="flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Back to sign in
          </Link>
        )}
      </FieldGroup>
    </div>
  );
}
