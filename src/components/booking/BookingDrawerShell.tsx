import { X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

interface BookingDrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

// Shared shell for §4's two drawers (buy-pass, sport-card) — grab handle, header + close, a
// scrollable row list, and a sticky footer CTA. Row content is entirely owned by the caller.
export function BookingDrawerShell({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: BookingDrawerShellProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      showSwipeHandle
    >
      <DrawerContent>
        <div className="flex items-start justify-between px-5 pb-2 pt-2.5">
          <div className="min-w-0 pr-3">
            <DrawerTitle className="text-xl font-extrabold text-gray-900">{title}</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13px] text-gray-500">
              {subtitle}
            </DrawerDescription>
          </div>
          <DrawerClose
            aria-label="Zamknij"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-4 w-4" />
          </DrawerClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">{children}</div>

        <div className="shrink-0 border-t border-gray-100 px-[18px] pb-5 pt-3">{footer}</div>
      </DrawerContent>
    </Drawer>
  );
}
