"use client";

import { AlertTriangle, Lightbulb, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type { StudioPass } from "./types";

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (pass: StudioPass) => void;
  studioId: string | null;
  dropInPrice: number | null;
  currency: string;
  editPass?: StudioPass | null;
}

function blockInvalidNumberChars(event: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

function fieldClass(hasError?: boolean) {
  return cn(
    "h-12 rounded-md bg-white px-3 text-base shadow-none focus-visible:ring-brand-green",
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

export function PassModal({
  isOpen,
  onClose,
  onSaved,
  studioId,
  dropInPrice,
  currency,
  editPass,
}: PassModalProps) {
  const [name, setName] = useState("");
  const [durationUnlimited, setDurationUnlimited] = useState(true);
  const [durationDays, setDurationDays] = useState<string>("");
  const [sessionUnlimited, setSessionUnlimited] = useState(true);
  const [sessionCount, setSessionCount] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editPass) {
      setName(editPass.name);
      setDurationUnlimited(editPass.duration_days == null || editPass.duration_days === "");
      setDurationDays(editPass.duration_days != null ? String(editPass.duration_days) : "");
      setSessionUnlimited(editPass.session_count == null || editPass.session_count === "");
      setSessionCount(editPass.session_count != null ? String(editPass.session_count) : "");
      setPrice(editPass.price != null ? String(editPass.price) : "");
      setDescription(editPass.description ?? "");
      setPhoto(editPass.photo ?? null);
      setPhotoPreviewUrl(null);
    } else {
      setName("");
      setDurationUnlimited(false);
      setDurationDays("");
      setSessionUnlimited(false);
      setSessionCount("");
      setPrice("");
      setDescription("");
      setPhoto(null);
      setPhotoPreviewUrl(null);
    }
    setError(null);
  }, [isOpen, editPass]);

  const sessionCountNum = sessionCount ? Number(sessionCount) : null;
  const priceNum = price ? Number(price) : null;
  const perEntry =
    sessionCountNum && sessionCountNum > 0 && priceNum != null
      ? (priceNum / sessionCountNum).toFixed(2)
      : null;

  const suggestedPrice =
    sessionCountNum && sessionCountNum > 0 && dropInPrice
      ? Math.round(sessionCountNum * dropInPrice * 0.9 * 100) / 100
      : null;

  const bothUnlimited = durationUnlimited && sessionUnlimited;

  async function handlePhotoFileSelect(file: File) {
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosInstance.post<{ image_id: string }>(
        "/events/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setPhoto(response.data.image_id);
    } catch {
      setError("Nie udało się przesłać zdjęcia.");
      setPhotoPreviewUrl(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Nazwa karnetu jest wymagana.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Cena jest wymagana.");
      return;
    }
    setError(null);
    setIsSaving(true);

    const passData = {
      name: name.trim(),
      price: Number(price),
      currency: currency || "PLN",
      description: description.trim() || undefined,
      photo: photo ?? undefined,
      duration_days: durationUnlimited ? null : Number(durationDays) || null,
      session_count: sessionUnlimited ? null : Number(sessionCount) || null,
    };

    try {
      if (studioId && editPass?.id) {
        const { data } = await axiosInstance.put(
          `/studios/${studioId}/passes/${editPass.id}`,
          passData,
        );
        onSaved(data);
      } else if (studioId) {
        const { data } = await axiosInstance.post(`/studios/${studioId}/passes`, passData);
        onSaved(data);
      } else {
        onSaved({ ...passData, price: passData.price } as StudioPass);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Nie udało się zapisać karnetu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{editPass ? "Edytuj karnet" : "Nowy karnet"}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4 space-y-4 max-h-[60vh]">
          {/* Nazwa */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Nazwa</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass(!name.trim() && !!error)}
              placeholder="np. Karnet miesięczny"
            />
          </div>

          {/* Ważność */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Ważność</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-full border text-sm",
                  !durationUnlimited
                    ? "border-brand-green font-semibold text-foreground"
                    : "border-border text-muted-foreground",
                )}
                onClick={() => setDurationUnlimited(false)}
              >
                Liczba dni
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-full border text-sm",
                  durationUnlimited
                    ? "border-brand-green font-semibold text-foreground"
                    : "border-border text-muted-foreground",
                )}
                onClick={() => {
                  setDurationUnlimited(true);
                  setDurationDays("");
                }}
              >
                ∞ Bez limitu
              </button>
            </div>
            {durationUnlimited && (
              <p className="text-sm text-muted-foreground mb-2">
                ∞ Karnet nie wygasa — ważny do wykorzystania wejść.
              </p>
            )}
            {!durationUnlimited && (
              <Input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                onKeyDown={blockInvalidNumberChars}
                placeholder="Liczba dni"
                className={fieldClass()}
              />
            )}
          </div>

          {/* Liczba wejść */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Liczba wejść</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-full border text-sm",
                  !sessionUnlimited
                    ? "border-brand-green font-semibold text-foreground"
                    : "border-border text-muted-foreground",
                )}
                onClick={() => setSessionUnlimited(false)}
              >
                Liczba
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-full border text-sm",
                  sessionUnlimited
                    ? "border-brand-green font-semibold text-foreground"
                    : "border-border text-muted-foreground",
                )}
                onClick={() => {
                  setSessionUnlimited(true);
                  setSessionCount("");
                }}
              >
                ∞ Bez limitu
              </button>
            </div>
            {!sessionUnlimited && (
              <Input
                type="number"
                min="1"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
                onKeyDown={blockInvalidNumberChars}
                placeholder="Liczba wejść"
                className={fieldClass()}
              />
            )}
          </div>

          {/* Both unlimited warning */}
          {bothUnlimited && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              Karnet bez limitu dni i wejść — upewnij się, że tego chcesz.
            </div>
          )}

          {/* Cena */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Cena</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={blockInvalidNumberChars}
                className={fieldClass()}
                placeholder={`Cena w ${currency}`}
              />
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {currency.toLowerCase() === "pln" ? "zł" : currency}
              </span>
            </div>
            {perEntry && (
              <p className="mt-1 text-sm text-muted-foreground">
                = <strong>{perEntry} {currency.toLowerCase() === "pln" ? "zł" : currency}/wejście</strong>
              </p>
            )}
            {suggestedPrice && !editPass && (
              <button
                type="button"
                className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-full text-left"
                onClick={() => setPrice(String(suggestedPrice))}
              >
                <Lightbulb className="size-4 shrink-0" />
                <span>Sugerowana: <strong>{suggestedPrice} {currency.toLowerCase() === "pln" ? "zł" : currency}</strong> (−10% vs cena za wejście). Stuknij, aby użyć.</span>
              </button>
            )}
          </div>

          {/* Opis */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Opis (opcjonalnie)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="Dodatkowe informacje..."
            />
          </div>

          {/* Zdjęcie */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Zdjęcie · opcjonalnie</label>
            <SingleImageUpload
              existingImageId={photo}
              imagePreviewUrl={photoPreviewUrl}
              isUploading={isUploadingPhoto}
              onFileSelect={handlePhotoFileSelect}
              onRemove={() => {
                setPhoto(null);
                setPhotoPreviewUrl(null);
              }}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <X className="size-5" />
            </Button>
          </DrawerClose>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
          >
            {isSaving ? "Zapisuję..." : <>{"✓"} Zapisz karnet</>}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
