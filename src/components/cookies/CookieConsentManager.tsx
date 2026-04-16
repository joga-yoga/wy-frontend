"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildCookieConsent,
  COOKIE_SETTINGS_OPEN_EVENT,
  getStoredCookieConsent,
  saveCookieConsent,
} from "@/lib/cookieConsent";
import { syncMixpanelAnalyticsConsent } from "@/lib/mixpanelClient";

import { CookieSettingsModal } from "./CookieSettingsModal";

const SITE_NAME_BY_PROJECT = {
  retreats: "wyjazdy.yoga",
  workshops: "wydarzenia.yoga",
} as const;

type CookieConsentManagerProps = {
  project: "retreats" | "workshops";
};

export function CookieConsentManager({ project }: CookieConsentManagerProps) {
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const siteName = useMemo(() => SITE_NAME_BY_PROJECT[project], [project]);

  useEffect(() => {
    const storedConsent = getStoredCookieConsent();
    if (!storedConsent?.decided) {
      setIsBannerOpen(true);
      return;
    }

    setAnalyticsEnabled(storedConsent.analytics);
    setMarketingEnabled(storedConsent.marketing);
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      const storedConsent = getStoredCookieConsent();
      if (storedConsent) {
        setAnalyticsEnabled(storedConsent.analytics);
        setMarketingEnabled(storedConsent.marketing);
      }

      setIsBannerOpen(false);
      setIsSettingsOpen(true);
    };

    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpenSettings);

    return () => {
      window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpenSettings);
    };
  }, []);

  const saveConsent = ({ analytics, marketing }: { analytics: boolean; marketing: boolean }) => {
    const consent = buildCookieConsent({ analytics, marketing });
    saveCookieConsent(consent);
    syncMixpanelAnalyticsConsent(consent.analytics);

    setAnalyticsEnabled(consent.analytics);
    setMarketingEnabled(consent.marketing);
    setIsBannerOpen(false);
    setIsSettingsOpen(false);
  };

  const consentButtonClass =
    "h-11 w-full rounded-xl text-base font-semibold focus-visible:border-transparent focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_#E5E7EB,0_0_0_2px_#2F3136]";

  const handleSettingsOpenChange = (open: boolean) => {
    setIsSettingsOpen(open);
    if (open) {
      return;
    }

    const storedConsent = getStoredCookieConsent();
    if (!storedConsent?.decided) {
      setIsBannerOpen(true);
    }
  };

  return (
    <>
      {isBannerOpen ? (
        <div className="fixed inset-x-0 bottom-3 z-50 px-3 sm:px-4">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 shadow-2xl sm:px-6 sm:py-6">
            <h2 className="text-2xl leading-tight font-semibold text-gray-900">
              Twoje dane, Twoja przestrzeń
            </h2>

            <p className="mt-3 text-base leading-relaxed text-gray-800">
              Używamy plików cookie i podobnych technologii, aby analizować ruch na stronie oraz
              dopasowywać treści i reklamy do Twoich zainteresowań. Dzięki temu możemy stale
              ulepszać naszą platformę i ułatwiać Ci planowanie kolejnych warsztatów i retreatów.
            </p>

            <p className="mt-3 text-base leading-relaxed text-gray-800">
              Klikając „Zaakceptuj wszystko”, wyrażasz zgodę na{" "}
              <Link href="/policy" className="font-semibold underline">
                Politykę plików cookie {siteName}
              </Link>
              . Swoje preferencje możesz zmienić w dowolnym momencie.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="default"
                className={consentButtonClass}
                autoFocus
                onClick={() => saveConsent({ analytics: true, marketing: true })}
              >
                Zaakceptuj wszystko
              </Button>

              <Button
                variant="default"
                className={consentButtonClass}
                onClick={() => saveConsent({ analytics: false, marketing: false })}
              >
                Tylko niezbędne
              </Button>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                className="text-base font-semibold text-gray-900 underline decoration-1 underline-offset-2 hover:text-gray-700"
                onClick={() => {
                  setIsBannerOpen(false);
                  setIsSettingsOpen(true);
                }}
              >
                Zarządzaj preferencjami
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CookieSettingsModal
        open={isSettingsOpen}
        analyticsEnabled={analyticsEnabled}
        marketingEnabled={marketingEnabled}
        onOpenChange={handleSettingsOpenChange}
        onAnalyticsChange={setAnalyticsEnabled}
        onMarketingChange={setMarketingEnabled}
        onAcceptAll={() => saveConsent({ analytics: true, marketing: true })}
        onSaveSelected={() =>
          saveConsent({
            analytics: analyticsEnabled,
            marketing: marketingEnabled,
          })
        }
      />
    </>
  );
}
