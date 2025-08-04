#!/usr/bin/env node

/**
 * Simple server monitoring script to check stability
 * Run with: node scripts/monitor-server.js
 */

const http = require('http');

let checks = 0;
let failures = 0;
let startTime = Date.now();

function checkServerHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve(health);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function runCheck() {
  checks++;
  const timestamp = new Date().toLocaleTimeString();
  
  try {
    const health = await checkServerHealth();
    const runtime = Date.now() - startTime;
    
    console.log(`✅ [${timestamp}] Check ${checks}: Server healthy (${Math.floor(health.uptime)}s uptime, ${Math.round(health.memory.used / 1024 / 1024)}MB memory)`);
    
    if (checks % 10 === 0) {
      console.log(`📊 Summary after ${checks} checks: ${failures} failures (${((failures/checks)*100).toFixed(1)}% failure rate) over ${Math.floor(runtime/1000)}s`);
    }
  } catch (error) {
    failures++;
    console.error(`❌ [${timestamp}] Check ${checks}: Server unhealthy - ${error.message}`);
  }
}

console.log('🚀 Starting server stability monitor...');
console.log('Press Ctrl+C to stop\n');

// Run check every 5 seconds
setInterval(runCheck, 5000);

// Run first check immediately
runCheck();

// Handle graceful shutdown
process.on('SIGINT', () => {
  const runtime = Date.now() - startTime;
  console.log(`\n\n📊 Final Summary:`);
  console.log(`Total checks: ${checks}`);
  console.log(`Failures: ${failures}`);
  console.log(`Success rate: ${(((checks-failures)/checks)*100).toFixed(1)}%`);
  console.log(`Runtime: ${Math.floor(runtime/1000)}s`);
  console.log('\n🛑 Monitor stopped');
  process.exit(0);
});
