"use client"

import { useEffect } from "react"
import { captureException } from "@/lib/analytics"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, { boundary: "global-error", digest: error.digest })
  }, [error])

  return (
    <html lang="en" translate="no">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#ffffff",
          color: "#0a0a0a",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ff5400",
          }}
        >
          Something broke
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "1.75rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          This page hit an unexpected error
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "28rem",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "#525252",
          }}
        >
          The screen did not load correctly. Try again, or return to sign in.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              borderRadius: "9999px",
              border: "none",
              background: "#ff5400",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Try again
          </button>
          <a
            href="/signin"
            style={{
              borderRadius: "9999px",
              border: "1px solid #e5e5e5",
              background: "#ffffff",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#0a0a0a",
              textDecoration: "none",
            }}
          >
            Back to sign in
          </a>
        </div>
      </body>
    </html>
  )
}
