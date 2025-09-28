"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-white !border !border-gray-200 !text-gray-900 font-medium shadow-lg dark:!bg-gray-800 dark:!text-white dark:!border-gray-700",
          description: "!text-gray-700 dark:!text-gray-300",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: undefined,
        error: undefined,
        warning: undefined,
        info: undefined,
      }}
      {...props}
    />
  )
}

export { Toaster }
