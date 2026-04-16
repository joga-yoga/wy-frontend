"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type CookieSettingsModalProps = {
  open: boolean;
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyticsChange: (enabled: boolean) => void;
  onMarketingChange: (enabled: boolean) => void;
  onAcceptAll: () => void;
  onSaveSelected: () => void;
};

export function CookieSettingsModal({
  open,
  analyticsEnabled,
  marketingEnabled,
  onOpenChange,
  onAnalyticsChange,
  onMarketingChange,
  onAcceptAll,
  onSaveSelected,
}: CookieSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Twoje ustawienia prywatności</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between space-x-4">
            <div className="space-y-1 pr-3">
              <h4 className="text-sm font-medium">Niezbędne</h4>
              <p className="text-xs text-muted-foreground">
                Wymagane do logowania i bezpiecznych płatności.
              </p>
            </div>
            <Switch disabled checked />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <div className="space-y-1 pr-3">
              <h4 className="text-sm font-medium">Analityczne</h4>
              <p className="text-xs text-muted-foreground">
                Pomagają nam ulepszać platformę (Mixpanel, GA).
              </p>
            </div>
            <Switch
              id="analytics-cookies"
              checked={analyticsEnabled}
              onCheckedChange={onAnalyticsChange}
            />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <div className="space-y-1 pr-3">
              <h4 className="text-sm font-medium">Marketingowe</h4>
              <p className="text-xs text-muted-foreground">
                Personalizacja ofert i reklamy (Meta Pixel).
              </p>
            </div>
            <Switch
              id="marketing-cookies"
              checked={marketingEnabled}
              onCheckedChange={onMarketingChange}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="default" onClick={onAcceptAll}>
            Zaakceptuj wszystkie
          </Button>
          <Button variant="outline" onClick={onSaveSelected}>
            Zapisz wybrane
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
