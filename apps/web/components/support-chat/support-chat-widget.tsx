"use client"

import { IconMessageCircle, IconX } from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"

import { ChatPanel } from "./chat-panel"
import { usePageContext } from "./use-page-context"
import { useSupportChat } from "./use-support-chat"

export function SupportChatWidget() {
  const pathname = usePathname()
  usePageContext()
  const chat = useSupportChat(pathname ?? "/")

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {chat.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <ChatPanel chat={chat} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={chat.toggleOpen}
        className="relative flex size-14 items-center justify-center rounded-full bg-blaze-orange text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={chat.isOpen ? "Close chat" : "Open chat"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={chat.isOpen ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            {chat.isOpen ? (
              <IconX className="size-6" />
            ) : (
              <IconMessageCircle className="size-6" />
            )}
          </motion.span>
        </AnimatePresence>
        {chat.hasUnread && (
          <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-brand-error ring-2 ring-background" />
        )}
      </button>
    </div>
  )
}
