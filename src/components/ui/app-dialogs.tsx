"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for delete/remove actions */
  tone?: "default" | "danger";
};

type PromptOptions = {
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type PromptRequest = PromptOptions & {
  resolve: (value: string | null) => void;
};

type AppDialogsApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const AppDialogsContext = createContext<AppDialogsApi | null>(null);

let externalApi: AppDialogsApi | null = null;

/** Imperative confirm — requires `<AppDialogsProvider>` in the tree. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (!externalApi) {
    console.warn("AppDialogsProvider is not mounted");
    return Promise.resolve(false);
  }
  return externalApi.confirm(options);
}

/** Imperative text prompt — requires `<AppDialogsProvider>` in the tree. */
export function promptDialog(options: PromptOptions): Promise<string | null> {
  if (!externalApi) {
    console.warn("AppDialogsProvider is not mounted");
    return Promise.resolve(null);
  }
  return externalApi.prompt(options);
}

export function useAppDialogs() {
  const ctx = useContext(AppDialogsContext);
  if (!ctx) {
    throw new Error("useAppDialogs must be used within AppDialogsProvider");
  }
  return ctx;
}

export function AppDialogsProvider({ children }: { children: ReactNode }) {
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const [promptReq, setPromptReq] = useState<PromptRequest | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmReq({ ...options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.defaultValue ?? "");
      setPromptReq({ ...options, resolve });
    });
  }, []);

  const api = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  useEffect(() => {
    externalApi = api;
    return () => {
      if (externalApi === api) externalApi = null;
    };
  }, [api]);

  const closeConfirm = (value: boolean) => {
    setConfirmReq((current) => {
      if (!current) return null;
      current.resolve(value);
      return null;
    });
  };

  const closePrompt = (value: string | null) => {
    setPromptReq((current) => {
      if (!current) return null;
      current.resolve(value);
      return null;
    });
    setPromptValue("");
  };

  const submitPrompt = () => {
    const trimmed = promptValue.trim();
    if (!trimmed) return;
    closePrompt(trimmed);
  };

  const danger = confirmReq?.tone === "danger";

  return (
    <AppDialogsContext.Provider value={api}>
      {children}

      <Dialog
        open={Boolean(confirmReq)}
        onOpenChange={(open) => {
          if (!open) closeConfirm(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{confirmReq?.title}</DialogTitle>
            <DialogDescription>{confirmReq?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeConfirm(false)}
            >
              {confirmReq?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              variant={danger ? "destructive" : "default"}
              onClick={() => closeConfirm(true)}
            >
              {confirmReq?.confirmLabel ?? "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(promptReq)}
        onOpenChange={(open) => {
          if (!open) closePrompt(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{promptReq?.title}</DialogTitle>
            {promptReq?.description ? (
              <DialogDescription>{promptReq.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="app-dialog-prompt">
              {promptReq?.label ?? "Name"}
            </Label>
            <Input
              id="app-dialog-prompt"
              autoFocus
              value={promptValue}
              placeholder={promptReq?.placeholder}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitPrompt();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => closePrompt(null)}
            >
              {promptReq?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={!promptValue.trim()}
              onClick={submitPrompt}
            >
              {promptReq?.confirmLabel ?? "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDialogsContext.Provider>
  );
}
