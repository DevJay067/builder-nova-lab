import { useEffect, useMemo, useState } from "react";
import { BuilderComponent, builder, useIsPreviewing } from "@builder.io/react";
import { Card, CardContent } from "@/components/ui/card";

// Configure your public API key via env or fallback to placeholder
const PUBLIC_API_KEY = (import.meta as any).env?.VITE_BUILDER_PUBLIC_KEY || "";
if (PUBLIC_API_KEY && typeof builder.apiKey === "string") {
  builder.init(PUBLIC_API_KEY);
}

export default function BuilderPage() {
  const [content, setContent] = useState<any>(null);
  const isPreviewing = useIsPreviewing();
  const urlPath = useMemo(() => {
    const path = window.location.pathname.replace(/^\/builder/, "");
    return path === "" ? "/" : path;
  }, []);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        if (!PUBLIC_API_KEY) return;
        const result = await builder.get("page", {
          userAttributes: { urlPath },
        }).toPromise();
        if (!canceled) setContent(result || null);
      } catch (e) {
        if (!canceled) setContent(null);
      }
    }
    load();
    return () => { canceled = true; };
  }, [urlPath]);

  if (!PUBLIC_API_KEY) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Builder.io not configured. Set `VITE_BUILDER_PUBLIC_KEY` in your env.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BuilderComponent model="page" content={content} />
      {isPreviewing && (
        <div className="fixed bottom-4 right-4 text-xs px-2 py-1 rounded bg-black/70 text-white">
          Builder preview
        </div>
      )}
    </div>
  );
}

