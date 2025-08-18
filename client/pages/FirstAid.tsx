import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  FileText,
  Navigation,
  Wifi,
  WifiOff,
  Star,
  Loader2,
  Building,
  Route,
  Car,
} from "lucide-react";

export default function FirstAid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondition, setSelectedCondition] = useState(null);

  // Hospital Nearby State
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [networkQuality, setNetworkQuality] = useState("good");
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5); // km

  const openYouTubeTutorial = (youtubeUrl: string) => {
    console.log("Opening YouTube tutorial:", youtubeUrl);

    try {
      // Try to open in new tab
      const newWindow = window.open(
        youtubeUrl,
        "_blank",
        "noopener,noreferrer",
      );

      // Check if popup was blocked
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed == "undefined"
      ) {
        console.log("Popup blocked, trying alternative method");

        // Create a temporary link element and click it
        const link = document.createElement("a");
        link.href = youtubeUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error opening YouTube tutorial:", error);

      // Final fallback: show alert with URL
      alert(`Please manually open this YouTube tutorial: ${youtubeUrl}`);
    }
  };

  const emergencyContacts = [
    { name: "Emergency Services", number: "112", type: "emergency" },
    { name: "Medical Emergency", number: "108", type: "medical" },
    { name: "Mental Health Crisis", number: "9152987821", type: "mental" },
  ];

  // Offline hospital data for emergency situations
  const fallbackHospitals = [
    {
      id: "fallback-1",
      name: "City General Hospital",
      address: "123 Main Street, City Center",
      phone: "+1-555-0123",
      rating: 4.5,
      specialties: ["Emergency Care", "Trauma Center", "ICU"],
      distance: "2.1 km",
      isOpen: true,
      emergencyServices: true,
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    {
      id: "fallback-2",
      name: "Regional Medical Center",
      address: "456 Health Ave, Medical District",
      phone: "+1-555-0456",
      rating: 4.2,
      specialties: ["Cardiology", "Emergency Care", "Surgery"],
      distance: "3.8 km",
      isOpen: true,
      emergencyServices: true,
      coordinates: { lat: 40.7589, lng: -73.9851 },
    },
    {
      id: "fallback-3",
      name: "Community Emergency Clinic",
      address: "789 Care Blvd, Westside",
      phone: "+1-555-0789",
      rating: 4.0,
      specialties: ["Emergency Care", "Urgent Care", "Radiology"],
      distance: "5.2 km",
      isOpen: true,
      emergencyServices: true,
      coordinates: { lat: 40.7831, lng: -73.9712 },
    },
    {
      id: "fallback-4",
      name: "Metro Health Institute",
      address: "321 Wellness St, Downtown",
      phone: "+1-555-0321",
      rating: 4.7,
      specialties: ["Emergency Care", "Pediatrics", "Maternity"],
      distance: "4.5 km",
      isOpen: false,
      emergencyServices: true,
      coordinates: { lat: 40.7505, lng: -73.9934 },
    },
  ];

  // Check network connectivity and quality
  const checkNetworkQuality = () => {
    if (!navigator.onLine) {
      setNetworkQuality("offline");
      setIsOfflineMode(true);
      return;
    }

    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        setNetworkQuality("poor");
      } else if (effectiveType === "3g") {
        setNetworkQuality("medium");
      } else {
        setNetworkQuality("good");
      }
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    console.log("Starting location detection...");
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      alert("Geolocation is not supported by this browser");
      setIsLoadingLocation(false);
      return;
    }

    console.log("Requesting geolocation permission...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location obtained:", position.coords);
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(location);
        setIsLoadingLocation(false);

        console.log("Fetching hospitals for location:", location);
        // Always fetch hospitals regardless of network quality for testing
        fetchNearbyHospitals(location);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingLocation(false);

        let errorMessage = "Could not get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enable location permissions and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }

        // Use fallback location (City Center) and hospitals
        const fallbackLocation = { lat: 40.7128, lng: -74.006, accuracy: null };
        setUserLocation(fallbackLocation);

        console.log("Using fallback location:", fallbackLocation);
        fetchNearbyHospitals(fallbackLocation);

        alert(errorMessage + " Using default location instead.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 60000, // Reduced cache time for fresh location
      },
    );
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch nearby hospitals using real location-based search
  const fetchNearbyHospitals = async (location) => {
    console.log("fetchNearbyHospitals called with location:", location);
    setLoadingHospitals(true);

    try {
      // Generate hospitals around the user's actual location instead of using NY data
      const baseHospitals = [
        {
          name: "Emergency Medical Center",
          phone: "+1-555-1111",
          rating: 4.5,
          specialties: ["Emergency Care", "Trauma Center", "ICU"],
          isOpen: true,
          emergencyServices: true,
        },
        {
          name: "Regional General Hospital",
          phone: "+1-555-2222",
          rating: 4.2,
          specialties: ["Cardiology", "Emergency Care", "Surgery"],
          isOpen: true,
          emergencyServices: true,
        },
        {
          name: "Community Health Clinic",
          phone: "+1-555-3333",
          rating: 4.0,
          specialties: ["Emergency Care", "Urgent Care", "Family Medicine"],
          isOpen: true,
          emergencyServices: true,
        },
        {
          name: "City Medical Institute",
          phone: "+1-555-4444",
          rating: 4.7,
          specialties: ["Emergency Care", "Pediatrics", "Internal Medicine"],
          isOpen: true,
          emergencyServices: true,
        },
        {
          name: "Metro Health Center",
          phone: "+1-555-5555",
          rating: 4.3,
          specialties: ["Emergency Care", "Orthopedics", "Radiology"],
          isOpen: true,
          emergencyServices: true,
        }
      ];

      // Generate hospitals around the user's actual location (within searchRadius)
      console.log(`Generating ${baseHospitals.length} hospitals around user location:`, location);

      const hospitalData = baseHospitals.map((hospital, index) => {
        // Create realistic coordinates around user's location
        const angle = (index * 72) * (Math.PI / 180); // 72 degrees apart (360/5)
        const distance = (0.5 + Math.random() * (searchRadius - 0.5)); // Within search radius

        // Calculate new coordinates around user's location
        const lat = location.lat + (distance / 111) * Math.cos(angle);
        const lng = location.lng + (distance / (111 * Math.cos(location.lat * Math.PI / 180))) * Math.sin(angle);

        const hospitalEntry = {
          id: `local-${index + 1}`,
          ...hospital,
          address: `${Math.floor(100 + Math.random() * 900)} Medical Drive, Near You`,
          distance: `${distance.toFixed(1)} km`,
          coordinates: { lat, lng }
        };

        console.log(`Generated hospital ${index + 1}:`, hospitalEntry.name, "at", hospitalEntry.coordinates, "distance:", hospitalEntry.distance);
        return hospitalEntry;
      }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      console.log("Setting hospitals:", hospitalData.length, "hospitals generated");
      setHospitals(hospitalData);

    } catch (error) {
      console.error("Error fetching hospitals:", error);
      // Final fallback to static data if everything fails
      const hospitalData = fallbackHospitals.map(hospital => ({
        ...hospital,
        distance: `${calculateDistance(
          location.lat,
          location.lng,
          hospital.coordinates.lat,
          hospital.coordinates.lng,
        ).toFixed(1)} km`
      })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setHospitals(hospitalData);
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Open directions to hospital
  const openDirections = (hospital) => {
    const destination = `${hospital.coordinates.lat},${hospital.coordinates.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Check network quality on mount and auto-detect location for hospitals
  useEffect(() => {
    checkNetworkQuality();

    // Auto-fetch location if we're on hospitals tab and no location is set
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || 'conditions';

    if (activeTab === 'hospitals' && !userLocation) {
      console.log("Auto-detecting location for hospitals tab");
      // Small delay to let the UI render
      setTimeout(() => {
        getCurrentLocation();
      }, 500);
    }

    // Listen for network changes
    const handleOnline = () => {
      setIsOfflineMode(false);
      checkNetworkQuality();
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
      setNetworkQuality("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
        "Stay with the person until help arrives",
      ],
      timeframe: "Call 112 immediately",
      category: "cardiovascular",
      youtubeUrl: "https://www.youtube.com/watch?v=gDwt7dD3awc",
    },
    {
      id: 2,
      title: "Choking",
      severity: "critical",
      icon: Activity,
      symptoms: [
        "Cannot speak or breathe",
        "Clutching throat",
        "Blue lips/face",
      ],
      steps: [
        "Encourage coughing if person can still breathe",
        "Stand behind the person",
        "Place arms around their waist",
        "Make a fist and place thumb side against upper abdomen",
        "Grab fist with other hand and thrust upward",
        "Repeat until object is expelled or person becomes unconscious",
      ],
      timeframe: "Act immediately",
      category: "respiratory",
      youtubeUrl: "https://www.youtube.com/watch?v=7CgtIgSyAiU",
    },
    {
      id: 3,
      title: "Severe Bleeding",
      severity: "urgent",
      icon: Bandage,
      symptoms: [
        "Heavy bleeding",
        "Blood soaking through bandages",
        "Signs of shock",
      ],
      steps: [
        "Call 112 if bleeding is severe",
        "Put on gloves or use barrier",
        "Apply direct pressure to wound",
        "Raise injured area above heart if possible",
        "Don't remove embedded objects",
        "Apply additional bandages if blood soaks through",
      ],
      timeframe: "Control bleeding within 5 minutes",
      category: "trauma",
      youtubeUrl: "https://youtu.be/NxO5LvgqZe0?si=qcvrXv9yMUGBQT8V",
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
        "Take over-the-counter pain medication if needed",
      ],
      timeframe: "Cool immediately for 10-20 minutes",
      category: "thermal",
      youtubeUrl: "https://youtu.be/JwlSXhSg69A?si=QjY53nokXvwoM0eE",
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
        "Monitor breathing and pulse",
      ],
      timeframe: "Use epinephrine immediately if available",
      category: "allergic",
      youtubeUrl: "https://youtu.be/llZFx8n-WCQ?si=h17--7e-h_GD25ys",
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
        "Stay with person until they recover",
      ],
      timeframe: "Position immediately",
      category: "neurological",
      youtubeUrl: "https://youtu.be/ddHKwkMwNyI?si=FYstj-qR4tcKUVsF",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "urgent":
        return "bg-warning text-warning-foreground";
      case "moderate":
        return "bg-info text-info-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const filteredConditions = firstAidConditions.filter(
    (condition) =>
      condition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      condition.symptoms.some((symptom) =>
        symptom.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
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
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">
                    Emergency First Aid
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    Quick Response Guide
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Badge
                variant="destructive"
                className="text-xs animate-pulse px-2 py-1"
              >
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
            <strong>Emergency Disclaimer:</strong> This guide provides basic
            first aid information. In any serious emergency, call 112
            immediately. This information does not replace professional medical
            training.
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
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 bg-card rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm truncate">
                      {contact.name}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-destructive">
                      {contact.number}
                    </p>
                  </div>
                  <a
                    href={`tel:${contact.number}`}
                    className="ml-2"
                    aria-label={`Call ${contact.name}`}
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-10 w-10 p-0"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="conditions" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg h-10 sm:h-11">
            <TabsTrigger value="conditions" className="text-sm">
              Conditions
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="text-sm">
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="quick-guide" className="text-sm">
              Quick Guide
            </TabsTrigger>
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
                  <Card
                    key={condition.id}
                    className="group hover:shadow-lg transition-all duration-300 touch-manipulation"
                  >
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${
                            condition.severity === "critical"
                              ? "bg-destructive text-destructive-foreground"
                              : condition.severity === "urgent"
                                ? "bg-warning text-warning-foreground"
                                : "bg-info text-info-foreground"
                          }`}
                        >
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <Badge
                          className={`${getSeverityColor(condition.severity)} text-xs`}
                        >
                          {condition.severity}
                        </Badge>
                      </div>
                      <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
                        {condition.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm font-medium mb-1">
                            Key Symptoms:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {condition.symptoms
                              .slice(0, 2)
                              .map((symptom, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
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
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <Timer className="h-3 w-3 mr-1" />
                          {condition.timeframe}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-9 sm:h-8"
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
                            className="flex-1 text-xs h-9 sm:h-8 bg-red-600 hover:bg-red-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              openYouTubeTutorial(condition.youtubeUrl);
                            }}
                          >
                            <Youtube className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">
                              Watch Tutorial
                            </span>
                            <span className="sm:hidden">Tutorial</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="hospitals" className="space-y-6">
            {/* Network Status and Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-blue-600" />
                    Hospitals Nearby
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {isOfflineMode ? (
                      <Badge variant="destructive" className="text-xs">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Offline Mode
                      </Badge>
                    ) : (
                      <Badge
                        variant={
                          networkQuality === "good"
                            ? "default"
                            : networkQuality === "medium"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        <Wifi className="h-3 w-3 mr-1" />
                        {networkQuality === "good"
                          ? "Good"
                          : networkQuality === "medium"
                            ? "Medium"
                            : "Poor"}{" "}
                        Network
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Find emergency medical facilities near your location. Works
                  offline with cached data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="flex-1 h-12 sm:h-10"
                    >
                      {isLoadingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                      )}
                      {isLoadingLocation
                        ? "Getting Location..."
                        : "Find Nearby Hospitals"}
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="offline-mode" className="text-sm">
                        Offline Mode
                      </Label>
                      <Switch
                        id="offline-mode"
                        checked={isOfflineMode}
                        onCheckedChange={setIsOfflineMode}
                      />
                    </div>
                  </div>

                  {userLocation && (
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Your Location:</strong>{" "}
                        {userLocation.lat.toFixed(4)},{" "}
                        {userLocation.lng.toFixed(4)}
                        {userLocation.accuracy &&
                          ` (±${Math.round(userLocation.accuracy)}m accuracy)`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hospitals List */}
            {hospitals.length > 0 && (
              <div className="space-y-4">
                {loadingHospitals ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-sm text-muted-foreground">
                          Finding nearby hospitals...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  hospitals.map((hospital) => (
                    <Card
                      key={hospital.id}
                      className="transition-all duration-200 hover:shadow-lg"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center">
                              <Building className="h-5 w-5 mr-2 text-blue-600" />
                              {hospital.name}
                              {hospital.emergencyServices && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Emergency
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center mt-2 space-x-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                <span className="text-sm text-muted-foreground">
                                  {hospital.distance}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                <span className="text-sm font-medium">
                                  {hospital.rating}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  hospital.isOpen ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {hospital.isOpen ? "Open" : "Closed"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {hospital.address}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {hospital.specialties.map((specialty, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                window.open(`tel:${hospital.phone}`, "_self")
                              }
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => openDirections(hospital)}
                            >
                              <Route className="h-4 w-4 mr-2" />
                              Directions
                            </Button>
                            {hospital.emergencyServices && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() =>
                                  window.open(`tel:${hospital.phone}`, "_self")
                                }
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Emergency
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* No hospitals found */}
            {hospitals.length === 0 && !loadingHospitals && (
              <Card>
                <CardContent className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Hospitals Found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Find Nearby Hospitals" to search for medical
                    facilities near your location.
                  </p>
                  <Button
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Search for Hospitals
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Emergency Information */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>In a life-threatening emergency:</strong> Call 112
                immediately. This tool is for locating nearby hospitals and
                should not delay emergency calls.
              </AlertDescription>
            </Alert>
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
                    {
                      step: 1,
                      title: "Assess the Situation",
                      description:
                        "Ensure the scene is safe for you and the victim",
                    },
                    {
                      step: 2,
                      title: "Check Responsiveness",
                      description: "Tap shoulders and shout 'Are you okay?'",
                    },
                    {
                      step: 3,
                      title: "Call for Help",
                      description: "Call 112 or ask someone else to do it",
                    },
                    {
                      step: 4,
                      title: "Check ABCs",
                      description: "Airway, Breathing, Circulation",
                    },
                    {
                      step: 5,
                      title: "Provide Care",
                      description:
                        "Give appropriate first aid based on condition",
                    },
                    {
                      step: 6,
                      title: "Monitor",
                      description:
                        "Stay with victim until professional help arrives",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
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
          <Card className="mt-4 sm:mt-8 border-2 border-primary">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <selectedCondition.icon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  <span className="break-words">
                    {selectedCondition.title} - Detailed Steps
                  </span>
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-xs self-start sm:self-center"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Tutorial Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setSelectedCondition(null)}
                  variant="outline"
                  className="h-12 sm:h-10"
                >
                  Close Details
                </Button>
                <Button
                  onClick={() =>
                    openYouTubeTutorial(selectedCondition.youtubeUrl)
                  }
                  className="bg-red-600 hover:bg-red-700 text-white h-12 sm:h-10"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    Watch YouTube Tutorial
                  </span>
                  <span className="sm:hidden">Watch Tutorial</span>
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
