#!/usr/bin/env node

/**
 * HealthChain Secure Medical Records System Setup
 * This script sets up the complete secure health system with blockchain integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    colorLog('blue', `🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    colorLog('green', `✅ ${description} completed`);
    return true;
  } catch (error) {
    colorLog('red', `❌ ${description} failed: ${error.message}`);
    return false;
  }
}

function createEnvFile() {
  colorLog('cyan', '📝 Creating environment configuration...');
  
  const envContent = `# HealthChain Secure Medical Records System Configuration
# =======================================================

# Node.js Environment
NODE_ENV=development
PORT=8080

# Database Configuration
DATABASE_URL=sqlite:./data/healthchain.db

# Encryption & Security Keys (Auto-generated - DO NOT SHARE)
JWT_SECRET=${generateSecureKey(64)}
ENCRYPTION_KEY=${generateSecureKey(64)}
SESSION_SECRET=${generateSecureKey(64)}

# Supabase Configuration (Optional - for enhanced features)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# IPFS/Web3.Storage Configuration
WEB3_STORAGE_TOKEN=your_web3_storage_token

# Blockchain Configuration
BLOCKCHAIN_PROVIDER_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=${generatePrivateKey()}
HEALTH_REGISTRY_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
BLOCKCHAIN_NETWORK_ID=31337

# External API Keys (Optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_api_key

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
`;

  fs.writeFileSync('.env', envContent);
  colorLog('green', '✅ Environment file created');
}

function generateSecureKey(length = 64) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

function generatePrivateKey() {
  const crypto = require('crypto');
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function createDirectoryStructure() {
  colorLog('cyan', '📁 Creating directory structure...');
  
  const directories = [
    'data',
    'uploads',
    'logs',
    'deployments',
    'contracts',
    'scripts',
    'test/blockchain',
    'server/services',
    'server/routes',
    'server/middleware',
    'client/components',
    'client/services',
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      colorLog('green', `  ✓ Created ${dir}/`);
    }
  });
}

function createPackageJsonIfNeeded() {
  if (!fs.existsSync('package.json')) {
    colorLog('cyan', '📦 Creating package.json...');
    
    const packageJson = {
      "name": "healthchain-secure-medical-records",
      "version": "1.0.0",
      "description": "Secure medical records system with blockchain integrity and IPFS storage",
      "main": "server/index.js",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "server": "node server/index.js",
        "server:dev": "nodemon server/index.js",
        "blockchain:compile": "hardhat compile",
        "blockchain:test": "hardhat test",
        "blockchain:deploy:local": "hardhat run scripts/deploy.js --network localhost",
        "blockchain:deploy:testnet": "hardhat run scripts/deploy.js --network sepolia",
        "blockchain:node": "hardhat node",
        "test": "npm run test:server && npm run blockchain:test",
        "test:server": "jest server/",
        "lint": "eslint . --ext .js,.ts,.jsx,.tsx",
        "lint:fix": "eslint . --ext .js,.ts,.jsx,.tsx --fix",
        "setup": "node setup-secure-health-system.js",
        "setup:db": "node server/services/initDatabase.js",
        "setup:blockchain": "npm run blockchain:compile && npm run blockchain:deploy:local"
      },
      "dependencies": {
        "@openzeppelin/contracts": "^4.9.3",
        "@supabase/supabase-js": "^2.38.0",
        "bcrypt": "^5.1.1",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "ethers": "^6.7.1",
        "express": "^4.18.2",
        "express-rate-limit": "^6.10.0",
        "helmet": "^7.0.0",
        "jsonwebtoken": "^9.0.2",
        "multer": "^1.4.5-lts.1",
        "sqlite3": "^5.1.6",
        "web3.storage": "^4.5.4"
      },
      "devDependencies": {
        "@nomicfoundation/hardhat-toolbox": "^3.0.2",
        "@nomicfoundation/hardhat-verify": "^1.1.1",
        "@openzeppelin/hardhat-upgrades": "^1.28.0",
        "@types/bcrypt": "^5.0.0",
        "@types/cors": "^2.8.13",
        "@types/express": "^4.17.17",
        "@types/multer": "^1.4.7",
        "@types/node": "^20.5.0",
        "hardhat": "^2.17.1",
        "hardhat-gas-reporter": "^1.0.9",
        "jest": "^29.6.2",
        "nodemon": "^3.0.1",
        "typescript": "^5.1.6"
      },
      "keywords": [
        "healthcare",
        "medical-records",
        "blockchain",
        "encryption",
        "ipfs",
        "security",
        "privacy"
      ],
      "author": "HealthChain Team",
      "license": "MIT"
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    colorLog('green', '✅ Package.json created');
  }
}

function createGitignore() {
  colorLog('cyan', '📝 Creating .gitignore...');
  
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
data/
*.db
*.db-shm
*.db-wal

# Logs
logs/
*.log

# Uploads
uploads/

# Build outputs
dist/
build/

# Blockchain artifacts
artifacts/
cache/
typechain-types/

# Deployment files (contains sensitive info)
deployments/
.openzeppelin/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
.nyc_output

# Temporary files
tmp/
temp/

# Private keys (NEVER commit these)
*.key
*.pem
private.txt
`;

  fs.writeFileSync('.gitignore', gitignoreContent);
  colorLog('green', '✅ .gitignore created');
}

function createReadme() {
  colorLog('cyan', '📚 Creating README.md...');
  
  const readmeContent = `# HealthChain Secure Medical Records System

🏥 **A blockchain-powered, encrypted medical records management system with IPFS storage and split-key authentication.**

## 🌟 Features

### 🔐 Security Features
- **Split-Key Authentication**: 256-bit keys split between client and server
- **AES-256-GCM Encryption**: Military-grade file encryption
- **Blockchain Integrity**: Immutable record hashes on-chain
- **IPFS Storage**: Decentralized, tamper-proof file storage
- **Zero-Knowledge Architecture**: Server never sees unencrypted data

### 🏥 Medical Features
- **Secure File Upload**: PDFs, images, DICOM files
- **Encrypted Metadata**: Titles, descriptions, tags
- **Access Logging**: Complete audit trail
- **Search & Discovery**: Encrypted search capabilities
- **File Integrity Verification**: Cryptographic verification

### ⛓️ Blockchain Features
- **Smart Contract Registry**: Solidity-based record registry
- **Tamper Protection**: Immutable record hashes
- **User Registration**: On-chain user management
- **Access Logging**: Blockchain-based audit trail
- **Multi-Network Support**: Ethereum, Polygon, testnets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- MetaMask (for blockchain features)

### Installation

1. **Clone and setup:**
   \`\`\`bash
   git clone <repository-url>
   cd healthchain-secure-medical-records
   npm run setup
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment:**
   - Edit \`.env\` file with your API keys
   - Get Web3.Storage token: https://web3.storage
   - Optional: Setup Supabase for enhanced features

4. **Start development:**
   \`\`\`bash
   # Start local blockchain (optional)
   npm run blockchain:node
   
   # Deploy smart contracts (optional)
   npm run blockchain:deploy:local
   
   # Start the server
   npm run dev
   \`\`\`

## 📡 API Endpoints

### Authentication
- \`POST /api/secure-health/register\` - Register new user
- \`POST /api/secure-health/login\` - Authenticate user
- \`POST /api/secure-health/verify-key\` - Verify key combination

### Medical Records
- \`POST /api/secure-health/upload\` - Upload encrypted medical file
- \`GET /api/secure-health/records\` - Get user's records
- \`GET /api/secure-health/download/:recordId\` - Download & decrypt file
- \`DELETE /api/secure-health/records/:recordId\` - Delete record
- \`GET /api/secure-health/search?q=term\` - Search records

### System
- \`GET /api/secure-health/stats\` - Get system statistics

## 🔧 Configuration

### Environment Variables

\`\`\`bash
# Core Configuration
NODE_ENV=development
PORT=8080
DATABASE_URL=sqlite:./data/healthchain.db

# Security Keys (auto-generated)
JWT_SECRET=...
ENCRYPTION_KEY=...
SESSION_SECRET=...

# IPFS Storage
WEB3_STORAGE_TOKEN=your_token_here

# Blockchain (optional)
BLOCKCHAIN_PROVIDER_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0x...
HEALTH_REGISTRY_CONTRACT_ADDRESS=0x...

# Supabase (optional)
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
\`\`\`

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│                 │    │                 │    │                 │
│ • React/Vue     │◄──►│ • Node.js/TS    │◄──►│ • Solidity      │
│ • Split Key     │    │ • Express API   │    │ • Smart Contract│
│ • MetaMask      │    │ • Encryption    │    │ • Event Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   IPFS Storage  │              │
         │              │                 │              │
         └─────────────►│ • Web3.Storage  │◄─────────────┘
                        │ • Encrypted     │
                        │ • Decentralized │
                        └─────────────────┘
\`\`\`

## 🔐 Security Model

### Split-Key Authentication
1. **Key Generation**: 256-bit secure random key
2. **Key Splitting**: Split into client/server halves
3. **Hash Storage**: SHA-256 hash stored for verification
4. **Recombination**: Keys combined only for encryption/decryption

### Encryption Flow
1. **File Upload**: Client provides key half
2. **Key Validation**: Server validates key combination
3. **Encryption**: AES-256-GCM with combined key
4. **IPFS Upload**: Encrypted data to IPFS
5. **Blockchain**: File hash stored on-chain

### Access Control
- Users can only access their own files
- Key validation required for all operations
- Rate limiting prevents abuse
- Complete audit trail maintained

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Test server only
npm run test:server

# Test blockchain only
npm run blockchain:test

# Test with coverage
npm run test:coverage
\`\`\`

## 🚀 Deployment

### Local Development
\`\`\`bash
npm run dev
\`\`\`

### Production Deployment
\`\`\`bash
# Build for production
npm run build

# Deploy to mainnet (configure first)
npm run blockchain:deploy:mainnet
\`\`\`

### Blockchain Networks
- **Local**: Hardhat network (development)
- **Sepolia**: Ethereum testnet
- **Mumbai**: Polygon testnet  
- **Mainnet**: Ethereum/Polygon production

## 📊 Monitoring

The system provides comprehensive monitoring:
- **Access Logs**: All file operations logged
- **Blockchain Events**: Smart contract event monitoring
- **System Stats**: Usage and performance metrics
- **Security Alerts**: Suspicious activity detection

## 🔒 Security Best Practices

1. **Key Management**: Never store private keys in code
2. **Environment Security**: Use secure environment variables
3. **Rate Limiting**: Prevent brute force attacks
4. **Audit Trail**: Complete operation logging
5. **Input Validation**: Strict input sanitization
6. **HTTPS Only**: Always use encrypted connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## ⚠️ Disclaimer

This system is for educational and development purposes. For production medical use, ensure compliance with HIPAA, GDPR, and other relevant regulations.

## 🆘 Support

- Documentation: Check the \`docs/\` directory
- Issues: GitHub Issues
- Security: Report privately to security@example.com

---

**Built with ❤️ for secure healthcare data management**
`;

  fs.writeFileSync('README.md', readmeContent);
  colorLog('green', '✅ README.md created');
}

function displayCompletionInfo() {
  colorLog('bright', '\n🎉 HealthChain Secure Medical Records System Setup Complete!');
  
  console.log(`
${colors.cyan}📋 Next Steps:${colors.reset}

1. ${colors.yellow}Configure your environment:${colors.reset}
   - Edit .env file with your API keys
   - Get Web3.Storage token: https://web3.storage
   - Optional: Setup Supabase for enhanced features

2. ${colors.yellow}Install dependencies:${colors.reset}
   npm install

3. ${colors.yellow}Start development (choose one):${colors.reset}
   
   ${colors.green}Option A - Full Stack with Blockchain:${colors.reset}
   npm run blockchain:node        # Start local blockchain
   npm run blockchain:deploy:local # Deploy contracts  
   npm run dev                    # Start the application
   
   ${colors.green}Option B - Backend Only:${colors.reset}
   npm run dev                    # Start without blockchain

4. ${colors.yellow}Access the application:${colors.reset}
   - Frontend: http://localhost:8080
   - API: http://localhost:8080/api/secure-health
   - Blockchain: http://localhost:8545 (if running local node)

${colors.cyan}🔐 Security Features:${colors.reset}
✅ Split-key authentication
✅ AES-256-GCM encryption  
✅ IPFS decentralized storage
✅ Blockchain integrity verification
✅ Rate limiting & validation
✅ Complete audit trail

${colors.cyan}📚 Documentation:${colors.reset}
- README.md - Complete guide
- API documentation in the code
- Smart contract documentation
- Security best practices

${colors.cyan}🧪 Testing:${colors.reset}
npm test                     # Run all tests
npm run test:server         # Test backend
npm run blockchain:test     # Test smart contracts

${colors.red}⚠️  Important Security Notes:${colors.reset}
- Never commit .env file or private keys
- Use strong API keys in production
- Enable HTTPS in production
- Regular security updates required

${colors.green}Happy coding! 🚀${colors.reset}
`);
}

// Main setup function
async function main() {
  console.clear();
  colorLog('bright', '🏥 HealthChain Secure Medical Records System Setup');
  colorLog('cyan', '='.repeat(60));
  
  try {
    // Create basic structure
    createDirectoryStructure();
    createPackageJsonIfNeeded();
    createEnvFile();
    createGitignore();
    createReadme();
    
    // Copy blockchain configuration files if they don't exist
    if (!fs.existsSync('hardhat.config.js')) {
      colorLog('cyan', '⛓️ Setting up blockchain configuration...');
      // In a real setup, these files would be copied from templates
      colorLog('yellow', '  📝 Please ensure hardhat.config.js is properly configured');
    }
    
    colorLog('green', '\n✅ All setup tasks completed successfully!');
    displayCompletionInfo();
    
  } catch (error) {
    colorLog('red', `❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
