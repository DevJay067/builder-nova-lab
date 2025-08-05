// Simple authentication test
async function testAuth() {
  const baseUrl = 'http://localhost:8080';
  
  console.log('🧪 Testing Enhanced Authentication System...');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${baseUrl}/api/auth/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Auth health check:', healthData.success ? 'PASS' : 'FAIL');
    console.log('   Database:', healthData.stats?.databasePath);
    console.log('   Users:', healthData.stats?.users || 0);
  } catch (error) {
    console.log('❌ Auth health check: FAIL -', error.message);
  }
  
  // Test 2: Register new user
  try {
    const registerData = {
      username: 'testuser' + Date.now(),
      password: 'testpass123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('📝 Registration:', registerResult.success ? 'PASS' : 'FAIL');
    
    if (registerResult.success) {
      console.log('   User ID:', registerResult.user?.id);
      console.log('   Session Token:', registerResult.user?.sessionToken ? '[SET]' : '[NOT SET]');
      console.log('   Secure System:', registerResult.user?.secureSystemActivated ? 'ACTIVE' : 'INACTIVE');
      
      // Test 3: Login with the same user
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('🔐 Login:', loginResult.success ? 'PASS' : 'FAIL');
      
      if (loginResult.success) {
        const sessionToken = loginResult.user?.sessionToken;
        
        // Test 4: Session verification
        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
          headers: { 'x-session-token': sessionToken }
        });
        
        const verifyResult = await verifyResponse.json();
        console.log('🔍 Session verification:', verifyResult.success ? 'PASS' : 'FAIL');
        
        // Test 5: Store health record
        const healthRecord = {
          type: 'checkup',
          data: {
            title: 'Test Checkup',
            description: 'Testing health record storage',
            date: new Date().toISOString().split('T')[0],
            doctor: 'Dr. Test'
          }
        };
        
        const storeResponse = await fetch(`${baseUrl}/api/auth/data-access`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-session-token': sessionToken 
          },
          body: JSON.stringify(healthRecord)
        });
        
        const storeResult = await storeResponse.json();
        console.log('🏥 Health record storage:', storeResult.success ? 'PASS' : 'FAIL');
        
        // Test 6: Retrieve health records
        const retrieveResponse = await fetch(`${baseUrl}/api/auth/data-access/records`, {
          headers: { 'x-session-token': sessionToken }
        });
        
        const retrieveResult = await retrieveResponse.json();
        console.log('📋 Health record retrieval:', retrieveResult.success ? 'PASS' : 'FAIL');
        console.log('   Records found:', retrieveResult.records?.length || 0);
        
        // Test 7: Logout
        const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'x-session-token': sessionToken }
        });
        
        const logoutResult = await logoutResponse.json();
        console.log('👋 Logout:', logoutResult.success ? 'PASS' : 'FAIL');
      } else {
        console.log('   Error:', loginResult.message);
      }
    } else {
      console.log('   Error:', registerResult.message);
    }
  } catch (error) {
    console.log('❌ Authentication test: FAIL -', error.message);
  }
  
  // Final stats
  try {
    const statsResponse = await fetch(`${baseUrl}/api/auth/stats`);
    const statsData = await statsResponse.json();
    console.log('\n📊 Final System Stats:');
    console.log('   Total Users:', statsData.stats?.users || 0);
    console.log('   Active Sessions:', statsData.stats?.activeSessions || 0);
    console.log('   Database Size:', statsData.stats?.databaseSize || 0, 'bytes');
  } catch (error) {
    console.log('❌ Stats check failed:', error.message);
  }
  
  console.log('\n✅ Authentication test completed!');
}

testAuth().catch(console.error);
