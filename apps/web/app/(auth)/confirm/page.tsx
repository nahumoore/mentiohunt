import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmView } from "@/components/auth/confirm-view";

export const metadata: Metadata = {
  title: "Confirm - Mentiohunt",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Suspense>
          <ConfirmView />
        </Suspense>
      </div>
    </main>
  );
}
