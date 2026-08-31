"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6">
          <div className="flex max-w-md flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
              Something went wrong!
            </h1>
            <p className="mb-8 text-sm text-muted-foreground">
              A critical error occurred. Please try again or contact support if the
              problem persists.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => reset()} size="lg" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
