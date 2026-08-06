import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BlockedState({
  title,
  body,
  contactHref,
}: {
  title: string;
  body: string;
  contactHref?: string | null;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <ShieldAlert className="h-7 w-7 text-gray-400" />
      </div>
      <h1 className="mt-4 text-xl font-extrabold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{body}</p>
      {contactHref && (
        <Button asChild variant="outline" className="mt-6">
          <a href={contactHref}>Skontaktuj się ze studiem</a>
        </Button>
      )}
    </div>
  );
}
