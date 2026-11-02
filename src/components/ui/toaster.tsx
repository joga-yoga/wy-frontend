"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

import { useToastPosition } from "./use-toast-position";

export function Toaster() {
  const { toasts } = useToast();
  const viewportRef = useToastPosition(toasts.some((toast) => toast.open !== false));

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid min-w-0 gap-1 [overflow-wrap:anywhere]">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport ref={viewportRef} />
    </ToastProvider>
  );
}
