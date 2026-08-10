"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { useYogaStyleCatalog, YogaStyleChips } from "@/components/common/YogaStyleChips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InstructorYogaStyleIn } from "@/types/instructor";

interface Props {
  value: InstructorYogaStyleIn[];
  onChange: (value: InstructorYogaStyleIn[]) => void;
}

export function YogaStyleSelector({ value, onChange }: Props) {
  const catalog = useYogaStyleCatalog();
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const selectedIds = value.filter((v) => v.yoga_style_id).map((v) => v.yoga_style_id as string);

  /** Reconcile the chip grid's flat id list back onto the richer item list, keeping
   *  custom-style entries and any descriptions already typed. */
  const handleSelectionChange = (ids: string[]) => {
    const kept = value.filter((v) => !v.yoga_style_id || ids.includes(v.yoga_style_id));
    const added = ids
      .filter((id) => !value.some((v) => v.yoga_style_id === id))
      .map((id) => ({ yoga_style_id: id, description: "" }));
    onChange([...kept, ...added]);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    onChange([...value, { yoga_style_id: null, custom_name: customName.trim(), description: "" }]);
    setCustomName("");
    setShowCustom(false);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <YogaStyleChips
        mode="multi"
        catalog={catalog}
        value={selectedIds}
        onChange={handleSelectionChange}
      />

      {value.map((item, i) => {
        const isCustom = !item.yoga_style_id;
        return (
          <div key={i} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {item.yoga_style_id
                  ? (catalog.find((s) => s.id === item.yoga_style_id)?.name ?? "Styl")
                  : item.custom_name}
                {isCustom && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    własny
                  </Badge>
                )}
              </span>
              <button type="button" onClick={() => removeItem(i)}>
                <X size={14} />
              </button>
            </div>

            <Textarea
              placeholder="Opis (opcjonalnie)"
              value={item.description ?? ""}
              onChange={(e) =>
                onChange(
                  value.map((v, idx) => (idx === i ? { ...v, description: e.target.value } : v)),
                )
              }
              rows={2}
              className="text-sm"
            />
          </div>
        );
      })}

      {showCustom ? (
        <div className="flex gap-2">
          <Input
            placeholder="Własna nazwa stylu"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <Button type="button" size="sm" onClick={addCustom}>
            Dodaj
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowCustom(false)}>
            Anuluj
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCustom(true)}>
          <Plus size={14} className="mr-1" /> Dodaj własny styl
        </Button>
      )}
    </div>
  );
}
