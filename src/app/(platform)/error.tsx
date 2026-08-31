"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Page Error</CardTitle>
          <CardDescription className="text-left mt-4 text-xs whitespace-pre-wrap break-all bg-muted p-2 rounded">
            <strong>Error:</strong> {error.message || 'Unknown error'}
            <br />
            <strong>Digest:</strong> {error.digest || 'No digest'}
            <br />
            {error.stack}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-4">
          <Button onClick={() => reset()} className="gap-2 w-full max-w-[200px]">
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Error ID: {error.digest || 'Unknown'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
