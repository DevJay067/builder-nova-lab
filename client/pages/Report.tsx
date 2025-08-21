import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function Report() {
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token =
          localStorage.getItem("sessionToken") ||
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("healthchain_session="))
            ?.split("=")[1];
        const resp = await fetch(`/api/health-records/${id}`, {
          headers: token
            ? { Authorization: `Bearer ${token}`, "x-session-token": token }
            : {},
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.error || "Failed to load record");
        setRecord(data.record);
      } catch (e: any) {
        setError(e.message || "Failed to load record");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">{error || "Record not found"}</p>
            <Link to="/history">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attachments = record?.metadata?.attachments as Array<{ name: string; url: string }> | undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-4">
          <Link to="/history">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
            </Button>
          </Link>
        </div>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>{record.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">{new Date(record.date).toLocaleString()}</div>
            {record.doctor && <div className="text-sm">Doctor: {record.doctor}</div>}
            <div className="whitespace-pre-wrap">{record.description}</div>
            {attachments && attachments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="space-y-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm truncate mr-3">{att.name}</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

