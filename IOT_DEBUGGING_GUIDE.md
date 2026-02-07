# IoT Smartwatch Data Flow Debugging Guide

## Overview
This guide provides step-by-step instructions to debug and resolve IoT smartwatch data flow issues in your healthcare platform.

## Current System Architecture

### Backend Components
- **Netlify Functions**: Serverless backend (`netlify/functions/api.ts`)
- **Express Server**: Main application server (`server/index.ts`)
- **IoT Service**: Enhanced vitals management (`server/services/iotVitals.ts`)
- **IoT Routes**: API endpoints (`server/routes/iot.ts`)

### Frontend Components
- **RealTimeMonitoring**: Main dashboard (`client/pages/RealTimeMonitoring.tsx`)
- **IoTDebugPanel**: Debugging interface (`client/components/IoTDebugPanel.tsx`)

## Step 1: Verify Backend Connectivity

### 1.1 Check Netlify Function Health
```bash
# Test the health endpoint
curl https://your-app.netlify.app/.netlify/functions/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Netlify function is working"
}
```

### 1.2 Test IoT API Endpoints
```bash
# Test latest vitals endpoint
curl https://your-app.netlify.app/api/health/vitals

# Test connection stats
curl https://your-app.netlify.app/api/vitals/debug/stats

# Test data flow
curl -X POST https://your-app.netlify.app/api/vitals/debug/test-flow
```

### 1.3 Enable Debug Mode
```bash
curl -X POST https://your-app.netlify.app/api/vitals/debug/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

## Step 2: Frontend Debugging

### 2.1 Access Debug Panel
1. Navigate to the Real-Time Monitoring page
2. Click the "Debug" button in the header
3. The IoT Debug Panel will appear with real-time statistics

### 2.2 Monitor Connection Statistics
The debug panel shows:
- **Connected Devices**: Number of active IoT devices
- **Active Clients**: Number of frontend connections
- **Successful Connections**: Total successful device connections
- **Data Points**: Number of data readings received
- **Last Data Received**: Timestamp of most recent data
- **Mock Data Status**: Whether simulation is running
- **Debug Mode**: Current debugging state

### 2.3 Test Data Flow
1. Click "Test Data Flow" in the debug panel
2. Verify the test completes successfully
3. Check the test results section for details

### 2.4 Start Mock Data Simulation
1. Click "Start Mock Data" in the debug panel
2. Verify mock data appears in the main dashboard
3. Check that vitals update every 3 seconds

## Step 3: Device Connection Verification

### 3.1 Bluetooth Device Testing
1. Click "Connect Bluetooth" in the main dashboard
2. Select your smartwatch from the device list
3. Verify connection status in the debug panel
4. Check for data reception

### 3.2 Register Test Device
1. Click "Register Test Device" in the debug panel
2. Verify device appears in connected devices list
3. Check device status and battery level

### 3.3 Monitor Device Status
The debug panel shows:
- Device ID and name
- Device type and connection method
- Connection status (connected/disconnected/syncing)
- Battery level
- Last seen timestamp
- Data quality rating

## Step 4: Data Flow Troubleshooting

### 4.1 Check Server-Sent Events (SSE)
1. Open browser developer tools
2. Navigate to Network tab
3. Look for SSE connection to `/api/vitals/stream`
4. Verify data is being received

### 4.2 Verify API Endpoints
Test each endpoint individually:

```bash
# Stream vitals (SSE)
curl -N https://your-app.netlify.app/api/vitals/stream

# Get latest vitals
curl https://your-app.netlify.app/api/health/vitals

# Update vitals manually
curl -X POST https://your-app.netlify.app/api/vitals/update \
  -H "Content-Type: application/json" \
  -d '{
    "heartRate": 75,
    "bloodPressure": {"systolic": 120, "diastolic": 80},
    "temperature": 98.6,
    "oxygenSaturation": 98,
    "respiratoryRate": 16,
    "deviceId": "test-device-001"
  }'
```

### 4.3 Check Error Logs
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check network request failures
4. Monitor SSE connection status

## Step 5: Common Issues and Solutions

### 5.1 No Data Received
**Symptoms**: Dashboard shows no updates, debug panel shows 0 data points

**Solutions**:
1. Check if mock data is running
2. Verify SSE connection is established
3. Test API endpoints manually
4. Enable debug mode for detailed logging

### 5.2 Bluetooth Connection Issues
**Symptoms**: Device not connecting, connection drops frequently

**Solutions**:
1. Ensure Web Bluetooth is supported (Chrome/Edge)
2. Check device is in pairing mode
3. Verify device supports required services
4. Try reconnecting multiple times

### 5.3 Data Quality Issues
**Symptoms**: Unrealistic values, missing data fields

**Solutions**:
1. Check data validation in IoT service
2. Verify device calibration
3. Monitor data quality ratings
4. Test with mock data for comparison

### 5.4 Performance Issues
**Symptoms**: Slow updates, high latency

**Solutions**:
1. Check network connectivity
2. Monitor server response times
3. Verify client connection count
4. Consider reducing update frequency

## Step 6: Production Deployment

### 6.1 Environment Variables
Ensure these are set in Netlify:
```bash
NODE_ENV=production
NODE_VERSION=18
```

### 6.2 Function Configuration
Verify `netlify.toml` includes:
```toml
[functions]
  external_node_modules = ["express", "bcrypt", "@neondatabase/serverless", "serverless-http"]
  node_bundler = "esbuild"
  included_files = ["server/**/*"]
```

### 6.3 CORS Configuration
Ensure CORS headers are properly set for your domain.

## Step 7: Monitoring and Maintenance

### 7.1 Regular Health Checks
- Monitor connection statistics daily
- Check for failed connections
- Verify data quality metrics
- Review error logs

### 7.2 Performance Monitoring
- Track response times
- Monitor memory usage
- Check client connection limits
- Review data throughput

### 7.3 Security Considerations
- Validate all incoming data
- Implement rate limiting
- Monitor for suspicious activity
- Regular security audits

## Troubleshooting Checklist

- [ ] Backend health check passes
- [ ] IoT API endpoints respond correctly
- [ ] Debug mode is enabled
- [ ] SSE connection established
- [ ] Mock data works correctly
- [ ] Bluetooth device connects (if applicable)
- [ ] Data validation passes
- [ ] No JavaScript errors in console
- [ ] Network requests succeed
- [ ] Real-time updates appear in dashboard

## Support and Resources

### API Documentation
- `/api/health/vitals` - Get latest vitals
- `/api/vitals/stream` - SSE stream for real-time updates
- `/api/vitals/update` - Update vitals manually
- `/api/vitals/debug/*` - Debugging endpoints

### Log Locations
- Browser Console: Frontend errors and network issues
- Netlify Function Logs: Backend errors and API issues
- IoT Service Logs: Device connection and data processing

### Contact Information
For additional support, check the application logs and use the debug panel to gather diagnostic information.