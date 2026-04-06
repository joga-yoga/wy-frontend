"use client";

import { useEffect, useState } from "react";

const FEATURE_FLAGS_STORAGE_KEY = "featureFlags";
export const FEATURE_FLAGS = {
  classes: "classes",
} as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

const isTruthy = (value: unknown): boolean => {
  if (value === true) {
    return true;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

export const getFeatureFlag = (flagName: FeatureFlagName): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const directValue = window.localStorage.getItem(`featureFlags.${flagName}`);
  if (isTruthy(directValue)) {
    return true;
  }

  const rawFlags = window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
  if (!rawFlags) {
    return false;
  }

  try {
    const parsedFlags = JSON.parse(rawFlags) as Record<string, unknown>;
    return isTruthy(parsedFlags?.[flagName]);
  } catch {
    return false;
  }
};

export const useFeatureFlag = (flagName: FeatureFlagName): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const syncFlag = () => setIsEnabled(getFeatureFlag(flagName));

    syncFlag();
    window.addEventListener("storage", syncFlag);

    return () => {
      window.removeEventListener("storage", syncFlag);
    };
  }, [flagName]);

  return isEnabled;
};
