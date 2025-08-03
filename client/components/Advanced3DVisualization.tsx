import { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Sphere, Box, Plane } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Activity,
  Heart,
  Thermometer,
  Droplets,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Download,
  Eye,
  Layers,
} from "lucide-react";
import * as THREE from "three";

interface HealthDataPoint {
  timestamp: number;
  heartRate: number;
  temperature: number;
  bloodPressure: { systolic: number; diastolic: number };
  oxygenSaturation: number;
  position: [number, number, number];
  color: string;
}

// Animated 3D Health Data Points
function HealthDataSphere({ 
  position, 
  color, 
  scale = 1, 
  healthData 
}: { 
  position: [number, number, number]; 
  color: string; 
  scale?: number;
  healthData: HealthDataPoint;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.scale.setScalar(
        scale * (hovered ? 1.2 : 1) * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.1)
      );
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.1 * scale, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </Sphere>
      {hovered && (
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`HR: ${healthData.heartRate} BPM\nTemp: ${healthData.temperature.toFixed(1)}°F\nO2: ${healthData.oxygenSaturation}%`}
        </Text>
      )}
    </group>
  );
}

// Animated Health Metrics Visualization
function HealthMetricsGraph({ data }: { data: HealthDataPoint[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Heart Rate Bars */}
      {data.map((point, index) => (
        <Box
          key={`hr-${index}`}
          position={[index * 0.2 - 2, point.heartRate / 200 - 0.5, -1]}
          args={[0.1, point.heartRate / 100, 0.1]}
        >
          <meshStandardMaterial color="#ef4444" />
        </Box>
      ))}
      
      {/* Temperature Line */}
      {data.map((point, index) => (
        <Sphere
          key={`temp-${index}`}
          position={[index * 0.2 - 2, (point.temperature - 96) / 4 - 0.5, 0]}
          args={[0.05, 8, 8]}
        >
          <meshStandardMaterial color="#f59e0b" />
        </Sphere>
      ))}
      
      {/* Oxygen Saturation */}
      {data.map((point, index) => (
        <Box
          key={`o2-${index}`}
          position={[index * 0.2 - 2, (point.oxygenSaturation - 95) / 10 - 0.5, 1]}
          args={[0.08, (point.oxygenSaturation - 95) / 20, 0.08]}
        >
          <meshStandardMaterial color="#06b6d4" />
        </Box>
      ))}

      {/* Grid */}
      <Plane args={[5, 3]} position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#f0f0f0" transparent opacity={0.3} wireframe />
      </Plane>
    </group>
  );
}

// Floating Health Status Indicators
function FloatingIndicators() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.position.y = Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
      });
    }
  });

  return (
    <group ref={groupRef}>
      <Text
        position={[-2, 1.5, 0]}
        fontSize={0.15}
        color="#ef4444"
        anchorX="center"
      >
        ❤️ Heart Rate
      </Text>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.15}
        color="#f59e0b"
        anchorX="center"
      >
        🌡️ Temperature
      </Text>
      <Text
        position={[2, 1.5, 0]}
        fontSize={0.15}
        color="#06b6d4"
        anchorX="center"
      >
        💧 Oxygen Sat
      </Text>
    </group>
  );
}

interface Advanced3DVisualizationProps {
  className?: string;
}

export default function Advanced3DVisualization({ className = "" }: Advanced3DVisualizationProps) {
  const [healthData, setHealthData] = useState<HealthDataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'scatter' | 'network'>('timeline');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'heartRate' | 'temperature' | 'oxygenSat'>('all');

  // Generate realistic health data
  useEffect(() => {
    const generateData = () => {
      const data: HealthDataPoint[] = [];
      const now = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const timestamp = now - (19 - i) * 60000; // 1 minute intervals
        const baseHeartRate = 72;
        const heartRate = baseHeartRate + Math.sin(i * 0.3) * 15 + Math.random() * 10;
        const temperature = 98.6 + Math.sin(i * 0.2) * 1.5 + (Math.random() - 0.5);
        const oxygenSaturation = 98 + Math.sin(i * 0.4) * 2 + Math.random() * 2;
        
        // Color based on heart rate
        let color = "#10b981"; // green (normal)
        if (heartRate > 100) color = "#ef4444"; // red (high)
        else if (heartRate < 60) color = "#3b82f6"; // blue (low)
        
        data.push({
          timestamp,
          heartRate: Math.round(heartRate),
          temperature: Number(temperature.toFixed(1)),
          bloodPressure: {
            systolic: 120 + Math.round(Math.random() * 20),
            diastolic: 80 + Math.round(Math.random() * 10),
          },
          oxygenSaturation: Math.round(oxygenSaturation),
          position: [i * 0.2 - 2, 0, 0] as [number, number, number],
          color,
        });
      }
      
      return data;
    };

    setHealthData(generateData());

    // Update data every 3 seconds when playing
    const interval = setInterval(() => {
      if (isPlaying) {
        setHealthData(generateData());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const metrics = [
    { id: 'all', name: 'All Metrics', icon: BarChart3, color: 'bg-gray-500' },
    { id: 'heartRate', name: 'Heart Rate', icon: Heart, color: 'bg-red-500' },
    { id: 'temperature', name: 'Temperature', icon: Thermometer, color: 'bg-yellow-500' },
    { id: 'oxygenSat', name: 'Oxygen Sat', icon: Droplets, color: 'bg-blue-500' },
  ];

  const viewModes = [
    { id: 'timeline', name: 'Timeline View', icon: Activity },
    { id: 'scatter', name: 'Scatter Plot', icon: Eye },
    { id: 'network', name: 'Network View', icon: Layers },
  ];

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Heart Rate,Temperature,Blood Pressure,Oxygen Saturation\n"
      + healthData.map(row => 
          `${new Date(row.timestamp).toISOString()},${row.heartRate},${row.temperature},${row.bloodPressure.systolic}/${row.bloodPressure.diastolic},${row.oxygenSaturation}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "health_data_3d_visualization.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={`shadow-colored-lg border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Advanced 3D Health Visualization</CardTitle>
              <CardDescription>
                Interactive 3D health data analysis with real-time rendering
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              WebGL Powered
            </Badge>
            <Badge variant={isPlaying ? "default" : "secondary"} className="text-xs">
              {isPlaying ? "Live" : "Paused"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {viewModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <Button
                  key={mode.id}
                  variant={viewMode === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode.id as any)}
                >
                  <IconComponent className="w-4 h-4 mr-1" />
                  {mode.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Metric Filters */}
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <Button
                key={metric.id}
                variant={selectedMetric === metric.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric(metric.id as any)}
                className="text-xs"
              >
                <IconComponent className="w-3 h-3 mr-1" />
                {metric.name}
              </Button>
            );
          })}
        </div>

        {/* 3D Visualization */}
        <div className="h-96 border rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
              
              {/* Controls */}
              <OrbitControls 
                enablePan={true} 
                enableZoom={true} 
                enableRotate={true}
                autoRotate={isPlaying}
                autoRotateSpeed={1}
              />
              
              {/* Data Visualization */}
              {viewMode === 'timeline' && (
                <HealthMetricsGraph data={healthData} />
              )}
              
              {viewMode === 'scatter' && (
                <group>
                  {healthData.map((point, index) => (
                    <HealthDataSphere
                      key={index}
                      position={[
                        (point.heartRate - 72) / 50,
                        (point.temperature - 98.6) / 2,
                        (point.oxygenSaturation - 98) / 5,
                      ]}
                      color={point.color}
                      scale={1 + (point.heartRate / 200)}
                      healthData={point}
                    />
                  ))}
                </group>
              )}
              
              {viewMode === 'network' && (
                <group>
                  {healthData.map((point, index) => (
                    <HealthDataSphere
                      key={index}
                      position={[
                        Math.cos(index * 0.3) * 2,
                        Math.sin(index * 0.2) * 1.5,
                        Math.sin(index * 0.4) * 1,
                      ]}
                      color={point.color}
                      scale={0.8}
                      healthData={point}
                    />
                  ))}
                </group>
              )}
              
              {/* Floating Labels */}
              <FloatingIndicators />
            </Suspense>
          </Canvas>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {healthData[healthData.length - 1]?.heartRate || '--'}
            </div>
            <div className="text-xs text-gray-600">Heart Rate (BPM)</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {healthData[healthData.length - 1]?.temperature || '--'}
            </div>
            <div className="text-xs text-gray-600">Temperature (°F)</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {healthData[healthData.length - 1]?.oxygenSaturation || '--'}%
            </div>
            <div className="text-xs text-gray-600">Oxygen Saturation</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {healthData.length}
            </div>
            <div className="text-xs text-gray-600">Data Points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
