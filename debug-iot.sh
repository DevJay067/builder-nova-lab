#!/bin/bash

# IoT Debugging Quick Start Script
# This script helps you quickly diagnose IoT smartwatch data flow issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
APP_URL=${APP_URL:-"https://your-app.netlify.app"}

echo -e "${BLUE}🔍 IoT Smartwatch Debugging Quick Start${NC}"
echo -e "${YELLOW}==========================================${NC}"
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
    esac
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-"GET"}
    local data=${4:-""}
    
    echo -e "${BLUE}Testing: $name${NC}"
    echo "URL: $url"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    else
        response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        print_status "success" "HTTP $http_code - $name working"
        if [ -n "$body" ]; then
            echo "Response: $body" | head -c 200
            echo ""
        fi
        return 0
    else
        print_status "error" "HTTP $http_code - $name failed"
        if [ -n "$body" ]; then
            echo "Error: $body"
        fi
        return 1
    fi
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_status "error" "curl is required but not installed"
    exit 1
fi

print_status "info" "Starting IoT debugging diagnostics..."
echo ""

# Test local development server
print_status "info" "Testing local development server..."
if test_endpoint "Local Health Check" "$BASE_URL/api/health/vitals"; then
    print_status "success" "Local server is running"
    LOCAL_SERVER=true
else
    print_status "warning" "Local server not responding"
    LOCAL_SERVER=false
fi

# Test production server
print_status "info" "Testing production server..."
if test_endpoint "Production Health Check" "$APP_URL/api/health/vitals"; then
    print_status "success" "Production server is responding"
    PROD_SERVER=true
else
    print_status "warning" "Production server not responding"
    PROD_SERVER=false
fi

echo ""
print_status "info" "Testing IoT endpoints..."

# Test IoT endpoints
if [ "$LOCAL_SERVER" = true ]; then
    SERVER_URL=$BASE_URL
elif [ "$PROD_SERVER" = true ]; then
    SERVER_URL=$APP_URL
else
    print_status "error" "No server is responding. Please start your development server or check your production URL."
    exit 1
fi

# Test IoT endpoints
test_endpoint "Connection Stats" "$SERVER_URL/api/vitals/debug/stats"
test_endpoint "Enable Debug Mode" "$SERVER_URL/api/vitals/debug/enable" "POST" '{"enabled": true}'
test_endpoint "Test Data Flow" "$SERVER_URL/api/vitals/debug/test-flow" "POST"
test_endpoint "Start Mock Data" "$SERVER_URL/api/vitals/mock/start" "POST"

# Test device registration
DEVICE_DATA='{"deviceId":"test-device-123","deviceName":"Test Smartwatch","deviceType":"smartwatch","connectionMethod":"bluetooth"}'
test_endpoint "Register Test Device" "$SERVER_URL/api/vitals/debug/device/register" "POST" "$DEVICE_DATA"

# Test vitals update
VITALS_DATA='{"heartRate":75,"bloodPressure":{"systolic":120,"diastolic":80},"temperature":98.6,"oxygenSaturation":98,"respiratoryRate":16,"deviceId":"test-device-001"}'
test_endpoint "Update Vitals" "$SERVER_URL/api/vitals/update" "POST" "$VITALS_DATA"

echo ""
print_status "info" "Debugging steps completed!"
echo ""

# Provide next steps
print_status "info" "Next steps:"
echo "1. Open your browser and navigate to: $SERVER_URL"
echo "2. Go to the Real-Time Monitoring page"
echo "3. Click the 'Debug' button to open the IoT Debug Panel"
echo "4. Use the debug panel to monitor connections and test data flow"
echo "5. Check the browser console for any JavaScript errors"
echo "6. If using a real smartwatch, try the Bluetooth connection feature"
echo ""

# Check for common issues
print_status "info" "Common issues to check:"
echo "• Ensure your development server is running (npm run dev)"
echo "• Check that all required environment variables are set"
echo "• Verify CORS settings if testing from a different domain"
echo "• Ensure your smartwatch is in pairing mode for Bluetooth testing"
echo "• Check browser console for JavaScript errors"
echo "• Verify network connectivity and firewall settings"
echo ""

# Provide helpful commands
print_status "info" "Helpful commands:"
echo "• Start development server: npm run dev"
echo "• Run IoT tests: node test-iot-endpoints.js"
echo "• Check logs: npm run dev (and watch console output)"
echo "• Test production: BASE_URL=$APP_URL node test-iot-endpoints.js"
echo ""

print_status "success" "Debugging setup complete! Refer to IOT_DEBUGGING_GUIDE.md for detailed instructions."