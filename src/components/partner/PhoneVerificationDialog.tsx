"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PhoneVerificationForm } from "./PhoneVerificationForm";

export function PhoneVerificationDialog({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zweryfikuj numer telefonu</DialogTitle>
          <DialogDescription>
            Zanim utworzysz studio, potwierdź numer telefonu kodem SMS.
          </DialogDescription>
        </DialogHeader>
        <PhoneVerificationForm
          onVerified={() => {
            onOpenChange(false);
            onVerified();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
