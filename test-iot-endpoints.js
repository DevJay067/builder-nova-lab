#!/usr/bin/env node

/**
 * IoT Endpoints Test Script
 * 
 * This script tests all IoT-related endpoints to verify they're working correctly.
 * Run this script to diagnose connection issues.
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: TIMEOUT,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  log(`\n${colors.bold}Testing: ${name}${colors.reset}`, 'blue');
  log(`URL: ${url}`, 'yellow');
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      log(`✅ SUCCESS (${response.statusCode})`, 'green');
      if (response.data && typeof response.data === 'object') {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    } else {
      log(`❌ FAILED (${response.statusCode})`, 'red');
      console.log('Response:', response.data);
    }
    
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log(`${colors.bold}IoT Endpoints Test Suite${colors.reset}`, 'blue');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  log(`Timeout: ${TIMEOUT}ms`, 'yellow');
  
  const results = [];
  
  // Test 1: Health endpoint
  results.push(await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/health/vitals`
  ));
  
  // Test 2: Connection stats
  results.push(await testEndpoint(
    'Connection Stats',
    `${BASE_URL}/api/vitals/debug/stats`
  ));
  
  // Test 3: Enable debug mode
  results.push(await testEndpoint(
    'Enable Debug Mode',
    `${BASE_URL}/api/vitals/debug/enable`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: true })
    }
  ));
  
  // Test 4: Test data flow
  results.push(await testEndpoint(
    'Test Data Flow',
    `${BASE_URL}/api/vitals/debug/test-flow`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ));
  
  // Test 5: Register test device
  results.push(await testEndpoint(
    'Register Test Device',
    `${BASE_URL}/api/vitals/debug/device/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: `test-device-${Date.now()}`,
        deviceName: 'Test Smartwatch',
        deviceType: 'smartwatch',
        connectionMethod: 'bluetooth'
      })
    }
  ));
  
  // Test 6: Start mock data
  results.push(await testEndpoint(
    'Start Mock Data',
    `${BASE_URL}/api/vitals/mock/start`,
    {
      method: 'POST'
    }
  ));
  
  // Test 7: Update vitals manually
  results.push(await testEndpoint(
    'Update Vitals',
    `${BASE_URL}/api/vitals/update`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 98.6,
        oxygenSaturation: 98,
        respiratoryRate: 16,
        deviceId: 'test-device-001',
        connectionStatus: 'connected',
        dataQuality: 'excellent'
      })
    }
  ));
  
  // Test 8: Get updated stats
  results.push(await testEndpoint(
    'Updated Connection Stats',
    `${BASE_URL}/api/vitals/debug/stats`
  ));
  
  // Test 9: Stop mock data
  results.push(await testEndpoint(
    'Stop Mock Data',
    `${BASE_URL}/api/vitals/mock/stop`,
    {
      method: 'POST'
    }
  ));
  
  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  log(`\n${colors.bold}Test Summary:${colors.reset}`, 'blue');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    log('🎉 All tests passed! Your IoT endpoints are working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above and refer to the debugging guide.', 'yellow');
  }
  
  return passed === total;
}

// Run the tests
if (require.main === module) {
  runTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };