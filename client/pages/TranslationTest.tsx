import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TranslationDemo from "@/components/TranslationDemo";
import { useTranslation } from "@/contexts/LanguageContext";

export default function TranslationTest() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="btn-smooth">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("nav.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Translation Test</h1>
              <p className="text-sm text-muted-foreground">
                Test Google Translate integration
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <TranslationDemo />
      </main>
    </div>
  );
}
