import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  ArrowLeft,
  Search,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Thermometer,
  Zap,
  Bandage,
  Users,
  MapPin,
  Timer,
  Youtube,
  ExternalLink,
  Play,
  FileText
} from "lucide-react";

export default function FirstAid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondition, setSelectedCondition] = useState(null);

  const openYouTubeTutorial = (youtubeUrl: string) => {
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const emergencyContacts = [
    { name: "Emergency Services", number: "112", type: "emergency" },
    { name: "Medical Emergency", number: "108", type: "medical" },
    { name: "Mental Health Crisis", number: "9152987821", type: "mental" }
  ];

  const firstAidConditions = [
    {
      id: 1,
      title: "Heart Attack",
      severity: "critical",
      icon: Heart,
      symptoms: ["Chest pain", "Shortness of breath", "Nausea", "Sweating"],
      steps: [
        "Call 112 immediately",
        "Help the person sit or lie down comfortably",
        "Loosen tight clothing around neck and chest",
        "If prescribed, help them take nitroglycerin",
        "If unconscious and not breathing, begin CPR",
        "Stay with the person until help arrives"
      ],
      timeframe: "Call 112 immediately",
      category: "cardiovascular",
      youtubeUrl: "https://www.youtube.com/watch?v=I_WXbWQNivc"
    },
    {
      id: 2,
      title: "Choking",
      severity: "critical",
      icon: Activity,
      symptoms: ["Cannot speak or breathe", "Clutching throat", "Blue lips/face"],
      steps: [
        "Encourage coughing if person can still breathe",
        "Stand behind the person",
        "Place arms around their waist",
        "Make a fist and place thumb side against upper abdomen",
        "Grab fist with other hand and thrust upward",
        "Repeat until object is expelled or person becomes unconscious"
      ],
      timeframe: "Act immediately",
      category: "respiratory",
      youtubeUrl: "https://www.youtube.com/watch?v=dBcOISmAxrE"
    },
    {
      id: 3,
      title: "Severe Bleeding",
      severity: "urgent",
      icon: Bandage,
      symptoms: ["Heavy bleeding", "Blood soaking through bandages", "Signs of shock"],
      steps: [
        "Call 112 if bleeding is severe",
        "Put on gloves or use barrier",
        "Apply direct pressure to wound",
        "Raise injured area above heart if possible",
        "Don't remove embedded objects",
        "Apply additional bandages if blood soaks through"
      ],
      timeframe: "Control bleeding within 5 minutes",
      category: "trauma",
      youtubeUrl: "https://www.youtube.com/watch?v=rSvBZmCCDlw"
    },
    {
      id: 4,
      title: "Burns",
      severity: "moderate",
      icon: Thermometer,
      symptoms: ["Red, painful skin", "Blisters", "Swelling"],
      steps: [
        "Remove from heat source safely",
        "Cool burn with cool (not cold) water for 10-20 minutes",
        "Remove jewelry/tight items before swelling",
        "Don't break blisters",
        "Cover with sterile gauze loosely",
        "Take over-the-counter pain medication if needed"
      ],
      timeframe: "Cool immediately for 10-20 minutes",
      category: "thermal",
      youtubeUrl: "https://www.youtube.com/watch?v=aIdKnIAKx5s"
    },
    {
      id: 5,
      title: "Allergic Reaction",
      severity: "urgent",
      icon: Zap,
      symptoms: ["Difficulty breathing", "Swelling", "Hives", "Rapid pulse"],
      steps: [
        "Call 112 for severe reactions",
        "Help person use epinephrine auto-injector if available",
        "Have person lie flat if conscious",
        "Remove or avoid allergen if known",
        "Loosen tight clothing",
        "Monitor breathing and pulse"
      ],
      timeframe: "Use epinephrine immediately if available",
      category: "allergic",
      youtubeUrl: "https://www.youtube.com/watch?v=hy8743HRQQU"
    },
    {
      id: 6,
      title: "Fainting",
      severity: "moderate",
      icon: Users,
      symptoms: ["Dizziness", "Weakness", "Nausea", "Loss of consciousness"],
      steps: [
        "Help person sit or lie down",
        "Raise legs 8-12 inches if lying down",
        "Loosen tight clothing",
        "Check for breathing and pulse",
        "If unconscious for more than 1 minute, call 112",
        "Stay with person until they recover"
      ],
      timeframe: "Position immediately",
      category: "neurological",
      youtubeUrl: "https://www.youtube.com/watch?v=2DR4ZmUUdYs"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'urgent': return 'bg-warning text-warning-foreground';
      case 'moderate': return 'bg-info text-info-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const filteredConditions = firstAidConditions.filter(condition =>
    condition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condition.symptoms.some(symptom => 
      symptom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-destructive text-destructive-foreground">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">Emergency First Aid</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Quick Response Guide</p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="destructive" className="text-xs animate-pulse px-2 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Emergency Ready</span>
                <span className="sm:hidden">Ready</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Emergency Alert */}
        <Alert className="mb-4 sm:mb-8 border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm leading-relaxed">
            <strong>Emergency Disclaimer:</strong> This guide provides basic first aid information.
            In any serious emergency, call 112 immediately. This information does not replace professional medical training.
          </AlertDescription>
        </Alert>

        {/* Emergency Contacts */}
        <Card className="mb-4 sm:mb-8 bg-gradient-to-r from-destructive/5 to-warning/5">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-destructive" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-card rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm truncate">{contact.name}</p>
                    <p className="text-xl sm:text-2xl font-bold text-destructive">{contact.number}</p>
                  </div>
                  <Button size="sm" variant="destructive" className="ml-2 h-10 w-10 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="conditions" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-10 sm:h-11">
            <TabsTrigger value="conditions" className="text-sm">Conditions</TabsTrigger>
            <TabsTrigger value="quick-guide" className="text-sm">Quick Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="conditions" className="space-y-4 sm:space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conditions or symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-12 text-base"
              />
            </div>

            {/* Conditions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredConditions.map((condition) => {
                const IconComponent = condition.icon;
                return (
                  <Card key={condition.id} className="group hover:shadow-lg transition-all duration-300 touch-manipulation">
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${
                          condition.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                          condition.severity === 'urgent' ? 'bg-warning text-warning-foreground' :
                          'bg-info text-info-foreground'
                        }`}>
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <Badge className={`${getSeverityColor(condition.severity)} text-xs`}>
                          {condition.severity}
                        </Badge>
                      </div>
                      <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
                        {condition.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Key Symptoms:</p>
                          <div className="flex flex-wrap gap-1">
                            {condition.symptoms.slice(0, 2).map((symptom, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                            {condition.symptoms.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{condition.symptoms.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Timer className="h-3 w-3 mr-1" />
                          {condition.timeframe}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCondition(condition);
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Read Steps
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              openYouTubeTutorial(condition.youtubeUrl);
                            }}
                          >
                            <Youtube className="h-3 w-3 mr-1" />
                            Watch Tutorial
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="quick-guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Universal Emergency Steps</CardTitle>
                <CardDescription>
                  Follow these steps in any emergency situation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Assess the Situation", description: "Ensure the scene is safe for you and the victim" },
                    { step: 2, title: "Check Responsiveness", description: "Tap shoulders and shout 'Are you okay?'" },
                    { step: 3, title: "Call for Help", description: "Call 112 or ask someone else to do it" },
                    { step: 4, title: "Check ABCs", description: "Airway, Breathing, Circulation" },
                    { step: 5, title: "Provide Care", description: "Give appropriate first aid based on condition" },
                    { step: 6, title: "Monitor", description: "Stay with victim until professional help arrives" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Condition Modal-like Detail */}
        {selectedCondition && (
          <Card className="mt-8 border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <selectedCondition.icon className="h-6 w-6 mr-2" />
                  {selectedCondition.title} - Detailed Steps
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <Play className="h-3 w-3 mr-1" />
                  Tutorial Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Symptoms to Look For:</h3>
                  <ul className="space-y-2">
                    {selectedCondition.symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-success" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">First Aid Steps:</h3>
                  <ol className="space-y-3">
                    {selectedCondition.steps.map((step, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <Alert className="mt-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Time Critical:</strong> {selectedCondition.timeframe}
                </AlertDescription>
              </Alert>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setSelectedCondition(null)}
                  variant="outline"
                >
                  Close Details
                </Button>
                <Button
                  onClick={() => openYouTubeTutorial(selectedCondition.youtubeUrl)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Watch YouTube Tutorial
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
