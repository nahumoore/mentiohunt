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
    <div className="relative my-6 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        {language && language !== "code" ? (
          <span className="font-mono text-xs text-zinc-400 lowercase dark:text-zinc-500">
            {language}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleCopy}
          className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <IconCheck size={13} className="text-zinc-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap wrap-break-word dark:text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
