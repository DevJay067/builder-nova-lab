import { useState, useEffect } from 'react';

export interface HealthMetric {
  id: string;
  type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen_saturation' | 'steps' | 'sleep' | 'weight';
  value: number | { systolic: number; diastolic: number };
  unit: string;
  timestamp: Date;
  deviceId?: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface HealthInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'critical';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  action: string;
  category: 'cardiovascular' | 'sleep' | 'activity' | 'nutrition' | 'mental_health';
  confidence: number; // 0-100
}

export interface HealthTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  significance: 'significant' | 'moderate' | 'minimal';
}

export function useHealthData() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching health data
  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate sample health metrics
        const sampleMetrics: HealthMetric[] = [
          {
            id: '1',
            type: 'heart_rate',
            value: 72,
            unit: 'BPM',
            timestamp: new Date(),
            quality: 'good'
          },
          {
            id: '2',
            type: 'blood_pressure',
            value: { systolic: 120, diastolic: 80 },
            unit: 'mmHg',
            timestamp: new Date(),
            quality: 'excellent'
          },
          {
            id: '3',
            type: 'steps',
            value: 8347,
            unit: 'steps',
            timestamp: new Date(),
            quality: 'good'
          },
          {
            id: '4',
            type: 'sleep',
            value: 7.2,
            unit: 'hours',
            timestamp: new Date(),
            quality: 'fair'
          }
        ];

        // Generate AI insights
        const sampleInsights: HealthInsight[] = [
          {
            id: '1',
            type: 'positive',
            title: 'Improved Heart Rate Variability',
            description: 'Your heart rate variability has improved by 12% this week, indicating better cardiovascular fitness and stress management.',
            importance: 'medium',
            action: 'Continue current exercise routine and stress management practices',
            category: 'cardiovascular',
            confidence: 87
          },
          {
            id: '2',
            type: 'warning',
            title: 'Sleep Quality Declining',
            description: 'Your deep sleep percentage has decreased from 22% to 16% over the past week. This may affect recovery and cognitive function.',
            importance: 'high',
            action: 'Improve sleep hygiene and consider reducing screen time before bed',
            category: 'sleep',
            confidence: 92
          },
          {
            id: '3',
            type: 'neutral',
            title: 'Activity Level Stable',
            description: 'Your daily step count and activity duration remain consistent with your established patterns.',
            importance: 'low',
            action: 'Consider adding variety to your exercise routine',
            category: 'activity',
            confidence: 78
          }
        ];

        // Generate trends
        const sampleTrends: HealthTrend[] = [
          {
            metric: 'Resting Heart Rate',
            direction: 'down',
            change: -3.2,
            period: 'Last 30 days',
            significance: 'significant'
          },
          {
            metric: 'Sleep Efficiency',
            direction: 'up',
            change: 5.1,
            period: 'Last 7 days',
            significance: 'moderate'
          },
          {
            metric: 'Daily Steps',
            direction: 'up',
            change: 12.8,
            period: 'Last 14 days',
            significance: 'significant'
          }
        ];

        setMetrics(sampleMetrics);
        setInsights(sampleInsights);
        setTrends(sampleTrends);
        setError(null);
      } catch (err) {
        setError('Failed to fetch health data');
        console.error('Health data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, []);

  const addMetric = (metric: Omit<HealthMetric, 'id' | 'timestamp'>) => {
    const newMetric: HealthMetric = {
      ...metric,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMetrics(prev => [...prev, newMetric]);
  };

  const getMetricsByType = (type: HealthMetric['type']) => {
    return metrics.filter(metric => metric.type === type);
  };

  const getLatestMetric = (type: HealthMetric['type']) => {
    const typeMetrics = getMetricsByType(type);
    return typeMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  };

  const getHealthScore = () => {
    // Calculate overall health score based on various metrics
    const heartRateMetric = getLatestMetric('heart_rate');
    const sleepMetric = getLatestMetric('sleep');
    const stepsMetric = getLatestMetric('steps');
    
    let score = 70; // Base score
    
    if (heartRateMetric) {
      const hr = heartRateMetric.value as number;
      if (hr >= 60 && hr <= 80) score += 10;
      else if (hr >= 50 && hr <= 90) score += 5;
    }
    
    if (sleepMetric) {
      const sleep = sleepMetric.value as number;
      if (sleep >= 7 && sleep <= 9) score += 10;
      else if (sleep >= 6 && sleep <= 10) score += 5;
    }
    
    if (stepsMetric) {
      const steps = stepsMetric.value as number;
      if (steps >= 8000) score += 10;
      else if (steps >= 5000) score += 5;
    }
    
    return Math.min(score, 100);
  };

  const getInsightsByCategory = (category: HealthInsight['category']) => {
    return insights.filter(insight => insight.category === category);
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  return {
    metrics,
    insights,
    trends,
    isLoading,
    error,
    addMetric,
    getMetricsByType,
    getLatestMetric,
    getHealthScore,
    getInsightsByCategory,
    refreshData
  };
}
