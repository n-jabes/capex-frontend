"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  nodeType: string;
  onRename: (name: string) => void;
  readOnly?: boolean;
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  nodeType,
  onRename,
  readOnly,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onRename(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? `${nodeType} Details` : `Rename ${nodeType}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label required={!readOnly}>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        {!readOnly && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
