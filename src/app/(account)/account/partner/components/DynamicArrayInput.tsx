"use client";

import { Trash2 } from "lucide-react";
import React, { createRef, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Control, Controller, FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventFormData } from "@/lib/schemas/event";

interface DynamicArrayInputProps {
  initialValues?: (string | undefined)[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<string[]>> | undefined;
  onFocus?: () => void;
  control: Control<EventFormData>;
  name: string;
}

export const DynamicArrayInput: React.FC<DynamicArrayInputProps> = ({
  initialValues = [""], // Default to empty array if undefined
  onChange,
  placeholder = "Wpisz wartość...",
  ariaLabel = "Lista elementów",
  error,
  onFocus,
  control,
  name,
}) => {
  // Initialize items. If initialValues is empty, start with [""]. Otherwise, use initialValues.
  // The useEffect below will ensure the trailing empty string rule.
  const [items, setItems] = useState<string[]>(
    initialValues.length > 0
      ? initialValues.filter((item): item is string => typeof item === "string")
      : [""],
  );
  const updateValues = useCallback(
    (values: string[]) => {
      setItems(values);
      // Effect to propagate changes up to the parent form
      onChange(values);
    },
    [onChange],
  );
  const inputRefs = useRef<RefObject<HTMLInputElement>[]>([]);

  // Effect to ensure the list always ends with an empty string if not empty,
  // or is [""] if logically empty.
  useEffect(() => {
    if (items.length === 0) {
      updateValues([""]); // Ensure it's never a completely empty array, always at least one input field.
    } else if (items[items.length - 1].trim() !== "") {
      setItems([...items, ""]); // Add a new empty input if the last one isn't empty.
    }
  }, [items, updateValues]); // This effect runs whenever 'items' changes.

  // // Effect to propagate changes up to the parent form
  // useEffect(() => {
  //   onChange(items);
  // }, [items, onChange]);

  // Effect to manage input refs for focusing
  useEffect(() => {
    inputRefs.current = items.map((_, i) => inputRefs.current[i] || createRef<HTMLInputElement>());
  }, [items]);

  const handleInputChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    updateValues(newItems); // The useEffect above will handle adding a new empty input if necessary.
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateValues(newItems); // The useEffect above will handle ensuring [""] or adding a trailing "" if needed.
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const newItems = [...items];
      newItems.splice(index + 1, 0, "");
      updateValues(newItems);
      setTimeout(() => {
        inputRefs.current[index + 1]?.current?.focus();
      }, 100);
    } else if (event.key === "Backspace" && items[index] === "") {
      if (items.length > 1) {
        // Only remove if it's not the last single empty item
        event.preventDefault();
        // Directly call the version of updateValues used in handleRemoveItem to trigger the effect correctly
        const newItems = items.filter((_, i) => i !== index);
        updateValues(newItems);
        setTimeout(() => {
          let focusIndexToSet = index > 0 ? index - 1 : 0;
          inputRefs.current[focusIndexToSet]?.current?.focus();
        }, 100);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.current?.focus();
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (index < items.length - 1) {
        inputRefs.current[index + 1]?.current?.focus();
      }
    }
  };

  return (
    <div className="space-y-2" aria-label={ariaLabel} onFocus={onFocus} tabIndex={onFocus ? 0 : -1}>
      {items.map((item, index) => {
        const itemError = Array.isArray(error) ? error[index] : null;
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center md:gap-2">
              <div className="relative flex-grow">
                <div className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-1 h-1 bg-black rounded-full"></div>
                <Input
                  type="text"
                  value={item}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={placeholder}
                  aria-label={`Element ${index + 1}`}
                  className={`flex-grow rounded-[20px] h-10 pl-[24px] md:pl-[44px] placeholder:text-gray-300 ${itemError ? "border-red-500" : ""}`}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={inputRefs.current[index]}
                />
              </div>
              {index < items.length - 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  aria-label={`Usuń element ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="w-9 h-9"> {/* Placeholder for button alignment */} </div>
              )}
            </div>
            {itemError && itemError.message && (
              <p className="text-xs text-red-500 pl-1">{itemError.message}</p>
            )}
          </div>
        );
      })}
      {/* Visually distinct placeholder for the "next" item, always disabled */}
      <div className="flex items-center md:gap-2 mt-1 opacity-50">
        <div className="relative flex-grow">
          <div className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
          <Input
            type="text"
            placeholder={placeholder}
            disabled
            aria-label="Dodaj kolejny element (wskazówka wizualna)"
            className="flex-grow rounded-[20px] h-10 pl-[24px] md:pl-[44px] placeholder:text-gray-300"
          />
        </div>
        <div className="w-9 h-9"> {/* Placeholder for button alignment */} </div>
      </div>

      {error && !Array.isArray(error) && typeof error === "object" && error.message && (
        <div className="mt-1">
          <p className="text-xs text-red-500">{error.message}</p>
        </div>
      )}
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <div
            ref={field.ref}
            tabIndex={-1}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
        )}
      />
    </div>
  );
};
