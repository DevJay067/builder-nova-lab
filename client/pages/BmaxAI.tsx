import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  ArrowLeft,
  Settings,
  Sparkles,
  Clock
} from "lucide-react";

export default function BmaxAI() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">B-max AI Assistant</h1>
                  <p className="text-sm text-muted-foreground">Your Personal Health AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Full-width AI Agent */}
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">B-max AI Health Assistant</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Live AI Agent
              </div>
            </div>
            <CardDescription>
              Your personal AI health companion trained specifically for healthcare guidance and support.
            </CardDescription>
          </CardHeader>

          {/* JotForm AI Agent Iframe */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <iframe
              src="https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1"
              className="w-full h-full border-0 rounded-b-lg"
              title="B-max AI Health Assistant"
              allow="microphone; camera"
              style={{ minHeight: '600px' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
