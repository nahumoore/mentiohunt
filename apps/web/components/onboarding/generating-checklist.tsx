"use client"

import { IconCheck, IconLoader2, IconRefresh, IconX } from "@tabler/icons-react"

export type TaskStatus = "pending" | "loading" | "done" | "error"

export type ChecklistTask = {
  id: string
  label: string
  status: TaskStatus
  error?: string
}

type GeneratingChecklistProps = {
  tasks: ChecklistTask[]
  onRetry: (id: string) => void
}

export function GeneratingChecklist({ tasks, onRetry }: GeneratingChecklistProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            {task.status === "loading" && (
              <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {task.status === "done" && (
              <IconCheck className="h-4 w-4 text-primary" strokeWidth={2.5} />
            )}
            {task.status === "error" && (
              <IconX className="h-4 w-4 text-destructive" strokeWidth={2.5} />
            )}
            {task.status === "pending" && (
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={
                task.status === "done"
                  ? "text-sm text-muted-foreground line-through"
                  : task.status === "error"
                    ? "text-sm text-destructive"
                    : "text-sm text-foreground"
              }
            >
              {task.label}
            </p>
            {task.status === "error" && task.error && (
              <p className="mt-0.5 text-xs text-destructive/80">{task.error}</p>
            )}
          </div>
          {task.status === "error" && (
            <button
              type="button"
              onClick={() => onRetry(task.id)}
              className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconRefresh className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
