import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import {
  ArrayPath,
  Control,
  FieldArray,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  PathValue,
  useFieldArray,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// TFormValues is the entire form's type
// TName must be a path within TFormValues that points to a string array
interface DynamicArrayInputProps<
  TFormValues extends FieldValues, // Use FieldValues as the base constraint for the form
  TName extends ArrayPath<TFormValues>, // TName must be a path to an array field
> {
  control: Control<TFormValues>;
  name: TName;
  label: string;
  register: UseFormRegister<TFormValues>;
  getValues: UseFormGetValues<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  itemPlaceholder?: string;
  addPlaceholder?: string;
  // This constraint ensures the array elements are strings.
  // PathValue<TFormValues, TName> gives the type of the array itself.
  // We are interested in the type of its elements.
  _elementsAreStrings?: PathValue<TFormValues, TName> extends Array<string | undefined | null>
    ? true
    : false;
}

export function DynamicArrayInput<
  TFormValues extends FieldValues,
  TName extends ArrayPath<TFormValues>,
>({
  control,
  name,
  label,
  register,
  getValues,
  setValue,
  errors,
  itemPlaceholder = "Wpisz wartość...",
  addPlaceholder = "Dodaj kolejny...",
}: DynamicArrayInputProps<TFormValues, TName>) {
  const { fields, append, remove } = useFieldArray<TFormValues, TName>({
    control,
    name: name, // Should now be correctly typed as ArrayPath<TFormValues>
  });

  // Watch the specific field value for changes to drive the useEffect logic
  const watchedFieldValue = getValues(name as Path<TFormValues>);
  console.log("🚀 ~ watchedFieldValue:", watchedFieldValue);

  useEffect(() => {
    const currentValues = watchedFieldValue as unknown as string[] | undefined;
    console.log("🚀 ~ useEffect ~ currentValues:", currentValues);

    if (currentValues && currentValues.length > 0) {
      if (currentValues[currentValues.length - 1]?.trim() !== "") {
        // The type of the item to append should match the array's element type.
        // If PathValue<TFormValues, TName> is string[], then item is string.
        append("" as PathValue<TFormValues, TName>[number], { shouldFocus: false });
      }
    } else {
      setValue(
        name as Path<TFormValues>,
        [""] as unknown as PathValue<TFormValues, Path<TFormValues>>,
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFieldValue, name, append]); // Rely on watchedFieldValue for changes

  const fieldError = errors?.[name as string];
  const fieldArrayErrorMessage =
    typeof fieldError?.message === "string" ? fieldError.message : undefined;

  console.log("🚀 ~ {fields.map ~ fields:", fields);
  return (
    <div className="space-y-2">
      <Label htmlFor={name as string}>{label}</Label>
      {fields.map((item, index) => {
        const currentFieldValue =
          (getValues(name as Path<TFormValues>) as unknown as string[])?.[index] ?? "";
        const isLastEmptyPlaceholder =
          index === fields.length - 1 && currentFieldValue.trim() === "";

        return (
          <div key={item.id} className="flex items-center space-x-2 group">
            {/* Path should be `${TName}.${number}` which is a valid FieldPath for register */}
            <Input
              {...register(`${name}.${index}` as FieldPath<TFormValues>)}
              placeholder={isLastEmptyPlaceholder ? addPlaceholder : itemPlaceholder}
              className={cn(
                isLastEmptyPlaceholder
                  ? "border-dashed opacity-70 focus:opacity-100 focus:border-solid"
                  : "",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (currentFieldValue.trim() !== "" && index === fields.length - 1) {
                    append("" as PathValue<TFormValues, TName>[number], { shouldFocus: true });
                  } else if (index < fields.length - 1) {
                    const nextInput = document.querySelector(
                      `input[name="${name as string}.${index + 1}"]`,
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  }
                }
              }}
            />
            {!(isLastEmptyPlaceholder && fields.length === 1) && !isLastEmptyPlaceholder && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                aria-label={`Usuń ${label} ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isLastEmptyPlaceholder && fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                aria-label={`Usuń ${label} ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      {fieldArrayErrorMessage && (
        <p className="text-sm text-destructive">{fieldArrayErrorMessage}</p>
      )}
    </div>
  );
}
