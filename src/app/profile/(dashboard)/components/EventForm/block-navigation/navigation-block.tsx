"use client";

import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NavigationBlockerContextProps {
  isBlocked: boolean;
  setBlocked: Dispatch<SetStateAction<boolean>>;
  openModal: (onConfirm: () => void) => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextProps | undefined>(
  undefined,
);

export function NavigationBlockerProvider({ children }: { children: React.ReactNode }) {
  const [isBlocked, setBlocked] = useState(false);
  const [show, setShow] = useState(false);
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const openModal = (onConfirm: () => void) => {
    setShow(true);
    setOnConfirm(() => onConfirm);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    setShow(false);
  };

  const handleCancel = () => {
    setShow(false);
  };

  return (
    <NavigationBlockerContext.Provider value={{ isBlocked, setBlocked, openModal }}>
      {children}
      <AlertDialog open={show} onOpenChange={setShow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masz niezapisane zmiany</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz opuścić tę stronę? Twoje zmiany zostaną utracone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Zostań</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Opuść</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error("useNavigationBlocker must be used within a NavigationBlockerProvider");
  }
  return context;
}

export function useIsBlocked() {
  const { isBlocked } = useNavigationBlocker();
  return isBlocked;
}

export function Blocker() {
  const { setBlocked } = useNavigationBlocker();
  useEffect(() => {
    setBlocked(true);
    return () => {
      setBlocked(false);
    };
  }, [setBlocked]);
  return null;
}

export function BlockBrowserNavigation() {
  const { isBlocked } = useNavigationBlocker();
  useEffect(() => {
    if (isBlocked) {
      const showModal = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = ""; // For legacy browsers
      };
      window.addEventListener("beforeunload", showModal);
      return () => {
        window.removeEventListener("beforeunload", showModal);
      };
    }
  }, [isBlocked]);

  return null;
}

export function BlockerWhenDirty({ control }: { control: ReturnType<typeof useForm>["control"] }) {
  const { dirtyFields } = useFormState({
    control,
  });

  return Object.keys(dirtyFields).length > 0 ? <Blocker /> : null;
}
