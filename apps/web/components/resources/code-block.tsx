"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b border-border">
        {language && language !== "code" ? (
          <span className="text-xs font-mono text-muted-foreground lowercase">
            {language}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer ml-auto"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <IconCheck size={13} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-relaxed font-mono whitespace-pre-wrap wrap-break-word">
        <code>{code}</code>
      </pre>
    </div>
  );
}
