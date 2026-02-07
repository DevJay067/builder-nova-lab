# IoT Smartwatch Integration Guide

## Overview
This guide provides step-by-step instructions for integrating, debugging, and troubleshooting your IoT smartwatch connection with the health monitoring platform.

## Features Implemented

### ✅ Real-Time Health Monitoring
- Live vital signs display (heart rate, blood pressure, temperature, oxygen saturation)
- Step counting and activity tracking
- Sleep analytics and quality monitoring
- Water intake tracking with reminders
- Device battery and connection status

### ✅ Smart Alarm System
- Sleep tracking with sleep stage detection
- Configurable alarms for sleep, medication, and exercise
- Water reminder system (5min, 30min, 60min intervals)
- Health analytics dashboard

### ✅ Emergency Calling System
- One-click emergency calling to 112, 108, and mental health crisis line
- Functional phone dialing integration
- Emergency contact management

### ✅ Comprehensive Debugging Tools
- IoT device connection testing
- Data flow verification
- System status monitoring
- Real-time data logging
- Bluetooth connection diagnostics

## Step-by-Step Debugging Instructions

### 1. Verify Backend Server Status

**Check if the server is running:**
```bash
# Start the development server
npm run dev

# Check server logs for IoT service initialization
# Look for: "✅ IoT vitals service initialized successfully"
```

**Test API endpoints:**
```bash
# Test system status
curl http://localhost:3000/api/vitals/system-status

# Test mock data generation
curl -X POST http://localhost:3000/api/vitals/mock/start

# Test data retrieval
curl http://localhost:3000/api/health/vitals
```

### 2. Frontend Connection Testing

**Access the Real-Time Monitoring Dashboard:**
1. Navigate to `/monitoring` in your browser
2. Click the "Debug" button to open debugging tools
3. Run "All Tests" to verify system connectivity

**Expected Results:**
- ✅ API Connection Test: Should show "success"
- ✅ Mock Data Test: Should generate sample health data
- ✅ Bluetooth Test: Will test if Web Bluetooth is supported

### 3. IoT Device Connection Verification

**For Bluetooth Smartwatch:**
1. Click "Connect Device" button
2. Select your smartwatch from the Bluetooth device list
3. Grant permissions when prompted
4. Verify connection status shows "Connected"

**For Mock/Simulated Data:**
1. Click "Start Mock" to begin simulated data generation
2. Watch real-time updates in the vital signs display
3. Verify data is updating every 3 seconds

### 4. Data Flow Verification

**Check Real-Time Updates:**
1. Open browser developer tools (F12)
2. Go to Network tab
3. Look for SSE (Server-Sent Events) connection to `/api/vitals/stream`
4. Verify data is flowing continuously

**Monitor Data Log:**
1. In the Debug panel, go to "Data Log" tab
2. Click "Refresh" to see recent data entries
3. Verify timestamps and data structure

### 5. Troubleshooting Common Issues

#### Issue: "Web Bluetooth not supported"
**Solution:**
- Use Chrome/Edge browser (Web Bluetooth support required)
- Enable experimental features in chrome://flags
- Use mock data for testing

#### Issue: "Device not connecting"
**Solution:**
1. Check device is in pairing mode
2. Verify device supports required services:
   - Heart Rate (0x180D)
   - Blood Pressure (0x1810)
   - Health Thermometer (0x1809)
   - Pulse Oximeter (0x1822)
3. Try refreshing the page and reconnecting

#### Issue: "No data showing"
**Solution:**
1. Check server is running (`npm run dev`)
2. Verify API endpoints are responding
3. Start mock data generation for testing
4. Check browser console for errors

#### Issue: "Emergency calling not working"
**Solution:**
- Ensure you're on HTTPS (required for telephony features)
- Test on mobile device for best compatibility
- Use tel: links as fallback

## API Endpoints Reference

### Core IoT Endpoints
```
GET  /api/vitals/stream          - Real-time data stream (SSE)
GET  /api/health/vitals          - Latest vital signs
POST /api/vitals/update          - Update vital signs
POST /api/vitals/mock/start      - Start mock data generation
POST /api/vitals/mock/stop       - Stop mock data generation
```

### Debugging Endpoints
```
GET  /api/vitals/system-status   - System health and status
GET  /api/vitals/devices         - Connected devices list
GET  /api/vitals/log             - Data log entries
POST /api/vitals/test-connection - Test device connection
POST /api/vitals/simulate-device - Simulate device connection
```

## Data Structure

### Vital Signs Payload
```typescript
interface VitalSigns {
  heartRate: number;                    // BPM
  bloodPressure: {                      // mmHg
    systolic: number;
    diastolic: number;
  };
  temperature: number;                  // °F
  oxygenSaturation: number;             // %
  respiratoryRate: number;              // breaths/min
  timestamp: string;                    // ISO string
  steps?: number;                       // step count
  battery?: number;                     // 0-100%
  sleepData?: {
    sleepStage: 'awake' | 'light' | 'deep' | 'rem';
    sleepDuration: number;              // minutes
    sleepQuality: number;               // 0-100
    sleepEfficiency: number;            // 0-100
  };
  waterIntake?: {
    dailyGoal: number;                  // ml
    currentIntake: number;              // ml
    lastDrink: string;                  // ISO string
  };
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    connectionType: 'bluetooth' | 'wifi' | 'cellular';
    signalStrength: number;             // 0-100
    lastSync: string;                   // ISO string
  };
}
```

## Testing Your Smartwatch Integration

### 1. Basic Connectivity Test
```javascript
// Test API connectivity
fetch('/api/vitals/system-status')
  .then(response => response.json())
  .then(data => console.log('System Status:', data))
  .catch(error => console.error('Connection failed:', error));
```

### 2. Mock Data Test
```javascript
// Start mock data generation
fetch('/api/vitals/mock/start', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log('Mock started:', data));

// Check for data updates
setInterval(() => {
  fetch('/api/health/vitals')
    .then(response => response.json())
    .then(data => console.log('Latest vitals:', data.vitals));
}, 3000);
```

### 3. Device Simulation Test
```javascript
// Simulate device data
const testData = {
  heartRate: 75,
  bloodPressure: { systolic: 120, diastolic: 80 },
  temperature: 98.6,
  oxygenSaturation: 98,
  respiratoryRate: 16,
  timestamp: new Date().toISOString(),
  steps: 100,
  battery: 85,
  deviceInfo: {
    deviceId: 'test_device',
    deviceName: 'Test Smartwatch',
    connectionType: 'bluetooth',
    signalStrength: 90,
    lastSync: new Date().toISOString()
  }
};

fetch('/api/vitals/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => console.log('Data updated:', data));
```

## Alarm and Reminder System

### Water Reminders
- **5-minute reminders**: Quick hydration prompts
- **30-minute reminders**: Regular hydration checks
- **60-minute reminders**: Extended hydration monitoring

### Sleep Tracking
- Automatic sleep stage detection
- Sleep quality and efficiency metrics
- Configurable sleep/wake alarms

### Emergency Features
- One-click emergency calling
- Pre-configured emergency contacts
- Mental health crisis support

## Performance Monitoring

### Real-Time Metrics
- Connection status monitoring
- Data throughput tracking
- Error rate monitoring
- Device battery level tracking

### Debug Information
- System health status
- Data flow verification
- Connection test results
- Error logging and troubleshooting

## Security Considerations

### Data Privacy
- All health data is processed locally when possible
- Secure transmission protocols (HTTPS/WSS)
- No sensitive data stored without encryption

### Device Security
- Bluetooth pairing verification
- Device authentication
- Secure data transmission

## Support and Troubleshooting

### Common Error Messages
- **"Bluetooth not supported"**: Use Chrome/Edge or enable mock data
- **"Device connection failed"**: Check device pairing and permissions
- **"No data received"**: Verify server is running and API endpoints are accessible
- **"Emergency call failed"**: Ensure HTTPS and mobile device compatibility

### Getting Help
1. Check the debug panel for detailed error information
2. Review browser console for JavaScript errors
3. Verify server logs for backend issues
4. Test with mock data to isolate device-specific problems

## Next Steps

### For Production Deployment
1. Set up proper SSL certificates for HTTPS
2. Configure production database for data persistence
3. Implement user authentication and data privacy controls
4. Set up monitoring and alerting systems
5. Configure backup and disaster recovery procedures

### For Advanced Features
1. Implement machine learning for health insights
2. Add support for additional health devices
3. Integrate with healthcare provider APIs
4. Develop mobile app versions
5. Add social features and health challenges

---

**Note**: This system is designed for demonstration and development purposes. For production healthcare applications, ensure compliance with relevant healthcare regulations and data protection laws.