"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";

import type { Event } from "@/app/(public)/retreats/types";
import { WyImage } from "@/components/custom/WyImage";
import { CardMapPinIcon } from "@/components/retreat-cta/RetreatCtaIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEventSourceUrl } from "@/lib/pendingEventImport";
import { renderShortLocation } from "@/lib/renderLocation";
import { cn } from "@/lib/utils";

export type CtaIconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export type CtaProcessStep = {
  title: string;
  description: ReactNode;
  icon: CtaIconComponent;
};

export type CtaPageProperty = {
  title: string;
  icon: CtaIconComponent;
  className?: string;
};

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-12 items-center px-6 md:h-[48px]", className)} aria-hidden="true">
      <div className="h-px w-full bg-[#E4E4E7]" />
    </div>
  );
}

export function ProcessSteps({
  steps,
  className,
  itemClassName,
  titleClassName,
  descriptionClassName,
}: {
  steps: CtaProcessStep[];
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <div className={className}>
      {steps.map((step) => {
        const Icon = step.icon;

        return (
          <article key={step.title} className={cn("flex items-center", itemClassName)}>
            <Icon className="size-9 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className={titleClassName}>{step.title}</h3>
              <p className={descriptionClassName}>{step.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PagePropertiesGrid({
  properties,
  className,
  itemClassName,
  iconClassName,
  textClassName,
}: {
  properties: CtaPageProperty[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={className}>
      {properties.map((property) => {
        const Icon = property.icon;

        return (
          <div
            key={property.title}
            className={cn("flex items-center", itemClassName, property.className)}
          >
            <Icon className={cn("size-6 shrink-0", iconClassName)} aria-hidden="true" />
            <span className={textClassName}>{property.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SourceUrlForm({
  id,
  label,
  placeholder,
  buttonLabel,
  emptyError,
  invalidError,
  onValidSubmit,
  className,
  inputClassName,
  buttonClassName,
}: {
  id: string;
  label: string;
  placeholder: string;
  buttonLabel: string;
  emptyError: string;
  invalidError: string;
  onValidSubmit: (url: string) => void;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const errorId = `${id}-error`;

  const submitUrl = () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError(emptyError);
      return;
    }

    if (!isValidEventSourceUrl(trimmedUrl)) {
      setError(invalidError);
      return;
    }

    onValidSubmit(trimmedUrl);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitUrl();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <div>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Input
          id={id}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={placeholder}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={inputClassName}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-[13px] leading-4 text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        variant="cta"
        className={buttonClassName}
        onClick={(event) => {
          event.preventDefault();
          submitUrl();
        }}
      >
        {buttonLabel}
      </Button>
    </form>
  );
}

export function CompactEventCard({
  event,
  hrefPrefix,
  fallbackDescription,
  variant = "retreat",
}: {
  event: Event;
  hrefPrefix: string;
  fallbackDescription: string;
  variant?: "retreat" | "workshop";
}) {
  const imageId = event.image_ids?.[0] ?? null;
  const location = renderShortLocation(event.location) || (event.is_online ? "Online" : "");
  const isWorkshop = variant === "workshop";

  return (
    <Link
      href={`${hrefPrefix}/${event.slug}`}
      className={cn(
        "flex w-full shrink-0 snap-start overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_8px_9px_rgba(0,0,0,0.06)]",
        isWorkshop ? "h-[88px] md:h-[134px]" : "h-[75px] md:h-[108px]",
      )}
    >
      <div
        className={cn(
          "relative w-[72px] shrink-0 overflow-hidden bg-[#E4E4E7]",
          isWorkshop ? "h-[88px] md:h-[134px]" : "h-[75px] md:h-[108px]",
        )}
      >
        {imageId ? (
          <WyImage src={imageId} alt={event.title} fill className="object-cover" sizes="72px" />
        ) : null}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 px-4",
          isWorkshop ? "py-[14px] md:py-[18px]" : "py-2 md:py-[18px]",
        )}
      >
        <h3 className="truncate text-[15px] font-semibold text-[#27272A]">{event.title}</h3>
        <p
          className={cn(
            "mt-1 truncate leading-4 text-[#757580]",
            isWorkshop ? "text-[13px]" : "text-[12px] md:text-[13px]",
          )}
        >
          {event.description || fallbackDescription}
        </p>
        {location && (
          <div className="mt-1 flex items-center gap-1">
            <CardMapPinIcon className="h-[11px] w-[10px]" aria-hidden="true" />
            <span className="truncate text-[12px] text-[#9D9DA5]">{location}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
