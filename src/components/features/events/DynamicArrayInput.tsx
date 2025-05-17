"use client";

import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react"; // useCallback for debouncing
import { FieldError, FieldErrorsImpl, Merge } from "react-hook-form"; // Import error types

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DynamicArrayInputProps {
  initialValues?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<string[]>> | undefined; // Updated error prop type
}

export const DynamicArrayInput: React.FC<DynamicArrayInputProps> = ({
  initialValues = [""], // Start with one empty input
  onChange,
  placeholder = "Wpisz wartość...",
  ariaLabel = "Lista elementów",
  error, // Destructure error prop
}) => {
  const [items, setItems] = useState<string[]>(initialValues.length > 0 ? initialValues : [""]);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const handleInputChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);

    // If the user is typing in the last input and it's not empty, add a new empty input
    if (index === items.length - 1 && value.trim() !== "") {
      setItems([...newItems, ""]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      if (items[0] !== "") {
        setItems([""]);
      }
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [""]);
  };

  return (
    <div className="space-y-2" aria-label={ariaLabel}>
      {items.map((item, index) => {
        // Determine if there is a specific error for this item
        const itemError = Array.isArray(error) ? error[index] : null;
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-1 h-1 bg-black rounded-full"></div>
                <Input
                  type="text"
                  value={item}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={placeholder}
                  aria-label={`Element ${index + 1}`}
                  className={`flex-grow rounded-[20px] h-10 pl-[44px] ${itemError ? "border-red-500" : ""}`}
                />
              </div>
              {(items.length > 1 || (items.length === 1 && items[0] !== "")) && (
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
              )}
            </div>
            {/* Display item-specific error directly below the input */}
            {itemError && itemError.message && (
              <p className="text-xs text-red-500 pl-1">{itemError.message}</p>
            )}
          </div>
        );
      })}
      {/* Visually distinct placeholder for the "next" item, always disabled */}
      <div className="flex items-center space-x-2 mt-1 opacity-50">
        <div className="relative flex-grow">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
          <Input
            type="text"
            placeholder={placeholder}
            disabled
            aria-label="Dodaj kolejny element (wskazówka wizualna)"
            className="flex-grow rounded-[20px] h-10 pl-[44px]"
          />
        </div>
        <div className="w-9 h-9"> {/* Placeholder for button alignment */} </div>
      </div>

      {/* General Error Display Area (for errors not specific to an item) */}
      {error && !Array.isArray(error) && typeof error === "object" && error.message && (
        <div className="mt-1">
          <p className="text-xs text-red-500">{error.message}</p>
        </div>
      )}
    </div>
  );
};
