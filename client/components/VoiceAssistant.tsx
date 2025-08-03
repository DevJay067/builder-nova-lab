import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  MessageCircle,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Waves,
  Languages,
} from "lucide-react";

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
  language?: string;
}

interface VoiceAssistantProps {
  className?: string;
}

export default function VoiceAssistant({ className = "" }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI health assistant. I can help you with medical questions, health tracking, and emergency guidance. How can I assist you today?',
      timestamp: new Date().toISOString(),
      language: 'en'
    }
  ]);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [supportedLanguages] = useState([
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = currentLanguage;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        handleUserMessage(transcript, confidence);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }
  }, [currentLanguage]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUserMessage = async (transcript: string, confidence: number = 1) => {
    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: transcript,
      timestamp: new Date().toISOString(),
      confidence,
      language: currentLanguage,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate AI processing with realistic health responses
    const aiResponse = await generateAIResponse(transcript);
    
    const assistantMessage: VoiceMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      language: currentLanguage,
    };

    setTimeout(() => {
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
      
      if (voiceEnabled) {
        speakMessage(aiResponse);
      }
    }, 1500);
  };

  const generateAIResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    
    // Advanced health AI responses
    if (input.includes('headache') || input.includes('head pain')) {
      return "I understand you're experiencing a headache. This could be due to various factors like stress, dehydration, or tension. I recommend staying hydrated, resting in a quiet dark room, and applying a cold compress. If headaches persist or worsen, please consult with your healthcare provider. Would you like me to log this symptom in your health records?";
    }
    
    if (input.includes('chest pain') || input.includes('heart')) {
      return "⚠️ IMPORTANT: Chest pain can be serious. If you're experiencing severe chest pain, shortness of breath, or pain radiating to your arm, jaw, or back, please seek immediate medical attention or call emergency services. For mild discomfort, monitor your symptoms and contact your healthcare provider. Should I help you find the nearest emergency room?";
    }
    
    if (input.includes('temperature') || input.includes('fever')) {
      return "A normal body temperature is around 98.6°F (37°C). Based on your recent vital signs monitoring, your temperature is within normal range. For fever management, stay hydrated, rest, and consider over-the-counter fever reducers if appropriate. Monitor your temperature regularly and seek medical care if it exceeds 103°F (39.4°C) or persists.";
    }
    
    if (input.includes('blood pressure') || input.includes('bp')) {
      return "Your recent blood pressure readings show you're within the normal range (less than 120/80 mmHg). To maintain healthy blood pressure, I recommend regular exercise, a balanced diet low in sodium, stress management, and adequate sleep. Continue monitoring with your connected devices. Would you like me to track your BP trends?";
    }
    
    if (input.includes('medication') || input.includes('medicine')) {
      return "I can help you manage your medications. For safety, please consult your healthcare provider before starting, stopping, or changing any medications. I can remind you about medication schedules, track adherence, and alert you to potential interactions. What specific medication questions do you have?";
    }
    
    if (input.includes('emergency') || input.includes('urgent')) {
      return "For medical emergencies, immediately call 911 or go to the nearest emergency room. I can help you find the closest hospital, provide first aid guidance, or contact emergency services. What type of emergency assistance do you need right now?";
    }
    
    if (input.includes('sleep') || input.includes('insomnia')) {
      return "Good sleep is crucial for health. Based on your activity data, I recommend maintaining a consistent sleep schedule, creating a relaxing bedtime routine, avoiding screens before bed, and keeping your bedroom cool and dark. Track your sleep patterns with your connected devices for better insights.";
    }
    
    if (input.includes('diet') || input.includes('nutrition') || input.includes('food')) {
      return "Nutrition plays a vital role in your health. I recommend a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains. Stay hydrated and limit processed foods. Based on your health profile, would you like personalized nutrition recommendations?";
    }
    
    if (input.includes('exercise') || input.includes('workout') || input.includes('fitness')) {
      return "Regular physical activity is excellent for your health! Your connected fitness tracker shows good activity levels. Aim for at least 150 minutes of moderate exercise weekly. I can help you create workout plans, track progress, and provide safety tips. What type of exercise interests you most?";
    }
    
    // Default intelligent response
    return `I understand your concern about "${userInput}". As your AI health assistant, I'm here to provide guidance and support. While I can offer general health information, please remember that I'm not a replacement for professional medical advice. For specific medical concerns, always consult with your healthcare provider. How else can I assist you with your health and wellness journey?`;
  };

  const speakMessage = (text: string) => {
    if (!synthesis || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking && synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getCurrentLanguageName = () => {
    return supportedLanguages.find(lang => lang.code === currentLanguage)?.name || 'English (US)';
  };

  return (
    <Card className={`shadow-colored-lg border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Voice Assistant</CardTitle>
              <CardDescription>
                Advanced speech-enabled health guidance
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Languages className="w-3 h-3 mr-1" />
              {getCurrentLanguageName()}
            </Badge>
            {isListening && (
              <Badge variant="default" className="animate-pulse">
                <Waves className="w-3 h-3 mr-1" />
                Listening
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="flex flex-wrap gap-2">
          {supportedLanguages.slice(0, 4).map((lang) => (
            <Button
              key={lang.code}
              variant={currentLanguage === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentLanguage(lang.code)}
              className="text-xs"
            >
              {lang.flag} {lang.name}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  {message.confidence && message.type === 'user' && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(message.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className="relative"
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Listening
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Listening
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={toggleVoice}
            className={voiceEnabled ? "border-green-500 text-green-600" : "border-gray-300"}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5 mr-2" />
                Voice Off
              </>
            )}
          </Button>
        </div>

        {/* Status Alerts */}
        {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the full voice experience.
            </AlertDescription>
          </Alert>
        )}

        {voiceEnabled && synthesis && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Voice assistant is ready! Click "Start Listening" and speak your health questions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
