import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  ArrowLeft, 
  Send, 
  Mic,
  Settings,
  Sparkles,
  MessageCircle,
  Clock,
  Shield,
  Zap
} from "lucide-react";

export default function BmaxAI() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Hello! I\'m B-max, your AI health assistant. How can I help you today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: chatHistory.length + 1,
      type: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory([...chatHistory, newMessage]);
    setMessage("");
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatHistory.length + 2,
        type: 'ai',
        message: 'I understand your concern. Let me analyze your health data and provide personalized recommendations. Please note that this is AI-generated advice and should not replace professional medical consultation.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const quickActions = [
    "Check my symptoms",
    "Review my medications",
    "Health recommendations",
    "Emergency guidance"
  ];

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - AI Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  B-max Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-success">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm font-medium">~2s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <span className="text-sm font-medium">94.7%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="ghost" 
                    className="w-full justify-start text-sm"
                    onClick={() => setMessage(action)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {action}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-accent" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All conversations are encrypted and stored securely on the blockchain. 
                  Your privacy is our priority.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Health Consultation</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Real-time
                  </div>
                </div>
                <CardDescription>
                  Discuss your health concerns with B-max AI. Remember, this is for informational purposes only.
                </CardDescription>
              </CardHeader>
              
              {/* Chat Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      chat.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-4' 
                        : 'bg-muted mr-4'
                    }`}>
                      <p className="text-sm">{chat.message}</p>
                      <p className="text-xs opacity-70 mt-2">{chat.timestamp}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Describe your health concern or ask a question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[80px] pr-12"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant={isListening ? "default" : "ghost"}
                      className="absolute bottom-2 right-2"
                      onClick={toggleListening}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-destructive' : ''}`} />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
