"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class CapexErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message || "Unexpected UI error in Capex workspace."}
          </p>
          <Button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
