import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { SplitKeyAuthService } from '../services/splitKeyAuthService';
import { EncryptionService } from '../services/encryptionService';
import { IPFSStorageService } from '../services/ipfsStorageService';
import { SupabaseService } from '../services/supabaseService';

const router = express.Router();

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: { success: false, error: 'Upload limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const accessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 access requests per hour
  message: { success: false, error: 'Access limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow medical file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/dicom',
      'text/plain',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only medical files are allowed.'));
    }
  }
});

// Validation middleware
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUserId = (userId: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
};

const validateKeyHalf = (keyHalf: string): boolean => {
  // Should be 32 hex characters (half of 64-char key)
  return /^[a-f0-9]{32}$/i.test(keyHalf);
};

// Authentication middleware
const authenticateSession = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.substring(7);
    const verification = SplitKeyAuthService.verifySessionToken(sessionToken);
    
    if (!verification.valid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
    }

    req.userId = verification.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

/**
 * POST /api/secure-health/register
 * Register a new user with split-key authentication
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, username, firstName, lastName, dateOfBirth, phone } = req.body;

    // Validate required fields
    if (!email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email and username are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-30 characters'
      });
    }

    // Register user with split-key authentication
    const result = await SplitKeyAuthService.registerUser(
      email,
      username,
      {
        firstName,
        lastName,
        dateOfBirth,
        phone
      }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log(`✅ User registered successfully: ${username}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.userId,
        clientKeyHalf: result.clientKeyHalf,
        username
      }
    });

  } catch (error) {
    console.error('❌ Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

/**
 * POST /api/secure-health/login
 * Authenticate user with split-key
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { userId, clientKeyHalf } = req.body;

    // Validate input
    if (!userId || !clientKeyHalf) {
      return res.status(400).json({
        success: false,
        error: 'User ID and client key half are required'
      });
    }

    if (!validateUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    if (!validateKeyHalf(clientKeyHalf)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key half format'
      });
    }

    // Get client IP for logging
    const clientIP = req.ip || req.connection.remoteAddress;

    // Authenticate user
    const result = await SplitKeyAuthService.authenticateUser(userId, clientKeyHalf);

    if (!result.success) {
      return res.status(401).json(result);
    }

    console.log(`✅ User authenticated successfully: ${userId}`);

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        sessionToken: result.sessionToken,
        userId: result.userId
      }
    });

  } catch (error) {
    console.error('❌ Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
});

/**
 * POST /api/secure-health/upload
 * Upload encrypted medical file to IPFS
 */
router.post('/upload', uploadLimiter, authenticateSession, upload.single('medicalFile'), async (req, res) => {
  try {
    const { clientKeyHalf, title, description, tags } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Medical file is required'
      });
    }

    if (!clientKeyHalf) {
      return res.status(400).json({
        success: false,
        error: 'Client key half is required for encryption'
      });
    }

    if (!validateKeyHalf(clientKeyHalf)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key half format'
      });
    }

    // Validate and get full encryption key
    const keyValidation = await SplitKeyAuthService.validateAndGetFullKey(userId, clientKeyHalf);
    if (!keyValidation.valid || !keyValidation.fullKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid key combination'
      });
    }

    const file = req.file;
    console.log(`📤 Uploading medical file: ${file.originalname} (${file.size} bytes)`);

    // Encrypt the file
    const encryptionResult = EncryptionService.encryptFile(
      file.buffer,
      keyValidation.fullKey,
      file.originalname || 'unknown',
      file.mimetype
    );

    if (!encryptionResult.success || !encryptionResult.encryptedBuffer) {
      return res.status(500).json({
        success: false,
        error: 'File encryption failed'
      });
    }

    // Upload to IPFS
    const ipfsResult = await IPFSStorageService.uploadMedicalRecord(
      encryptionResult.encryptedBuffer,
      file.originalname || 'unknown',
      file.mimetype,
      userId,
      keyValidation.fullKey,
      encryptionResult.metadata!
    );

    if (!ipfsResult.success || !ipfsResult.cid) {
      return res.status(500).json({
        success: false,
        error: 'IPFS upload failed'
      });
    }

    // Encrypt metadata if provided
    let encryptedTitle = undefined;
    let encryptedDescription = undefined;

    if (title) {
      const titleEncryption = EncryptionService.encryptText(title, keyValidation.fullKey);
      encryptedTitle = titleEncryption.success ? titleEncryption.encryptedText : undefined;
    }

    if (description) {
      const descEncryption = EncryptionService.encryptText(description, keyValidation.fullKey);
      encryptedDescription = descEncryption.success ? descEncryption.encryptedText : undefined;
    }

    // Store metadata in Supabase
    const metadataResult = await SupabaseService.storeMedicalRecordMetadata({
      userId,
      cid: ipfsResult.cid,
      originalName: file.originalname || 'unknown',
      mimeType: file.mimetype,
      size: file.size,
      encryptedTitle,
      encryptedDescription,
      uploadTimestamp: new Date().toISOString(),
      checksum: ipfsResult.fileHash || '',
      encryptionMetadata: encryptionResult.metadata!,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      isActive: true
    });

    if (!metadataResult.success) {
      console.warn('⚠️ Failed to store metadata in Supabase, but file uploaded to IPFS');
    }

    console.log(`✅ Medical file uploaded successfully. CID: ${ipfsResult.cid}`);

    res.status(201).json({
      success: true,
      message: 'Medical file uploaded successfully',
      data: {
        cid: ipfsResult.cid,
        recordId: metadataResult.recordId,
        fileHash: ipfsResult.fileHash,
        size: ipfsResult.size
      }
    });

  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during upload'
    });
  }
});

/**
 * GET /api/secure-health/records
 * Get user's medical records metadata
 */
router.get('/records', accessLimiter, authenticateSession, async (req, res) => {
  try {
    const userId = req.userId;

    // Get records from Supabase
    const result = await SupabaseService.getUserMedicalRecords(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve medical records'
      });
    }

    res.json({
      success: true,
      message: `Retrieved ${result.records?.length || 0} medical records`,
      data: {
        records: result.records || [],
        total: result.records?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Records endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during records retrieval'
    });
  }
});

/**
 * GET /api/secure-health/download/:recordId
 * Download and decrypt medical file
 */
router.get('/download/:recordId', accessLimiter, authenticateSession, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { clientKeyHalf } = req.query;
    const userId = req.userId;

    // Validate input
    if (!recordId || !clientKeyHalf) {
      return res.status(400).json({
        success: false,
        error: 'Record ID and client key half are required'
      });
    }

    if (!validateKeyHalf(clientKeyHalf as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key half format'
      });
    }

    // Validate and get full encryption key
    const keyValidation = await SplitKeyAuthService.validateAndGetFullKey(userId, clientKeyHalf as string);
    if (!keyValidation.valid || !keyValidation.fullKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid key combination'
      });
    }

    // Get record metadata
    const metadataResult = await SupabaseService.getMedicalRecordMetadata(recordId, userId);
    if (!metadataResult.success || !metadataResult.record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found or access denied'
      });
    }

    const record = metadataResult.record;
    console.log(`📥 Downloading medical record: ${record.originalName}`);

    // Download from IPFS
    const ipfsResult = await IPFSStorageService.downloadMedicalRecord(record.cid, userId);
    if (!ipfsResult.success || !ipfsResult.fileBuffer) {
      return res.status(500).json({
        success: false,
        error: 'Failed to download file from IPFS'
      });
    }

    // Decrypt the file
    const decryptionResult = EncryptionService.decryptFile(
      ipfsResult.fileBuffer,
      keyValidation.fullKey,
      record.encryptionMetadata
    );

    if (!decryptionResult.success || !decryptionResult.fileBuffer) {
      return res.status(500).json({
        success: false,
        error: 'File decryption failed'
      });
    }

    console.log(`✅ Medical record downloaded and decrypted: ${record.originalName}`);

    // Set appropriate headers
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${record.originalName}"`);
    res.setHeader('Content-Length', decryptionResult.fileBuffer.length);
    
    res.send(decryptionResult.fileBuffer);

  } catch (error) {
    console.error('❌ Download endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during download'
    });
  }
});

/**
 * DELETE /api/secure-health/records/:recordId
 * Delete (deactivate) a medical record
 */
router.delete('/records/:recordId', accessLimiter, authenticateSession, async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.userId;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required'
      });
    }

    // Delete record
    const result = await SupabaseService.deleteMedicalRecord(recordId, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found or access denied'
      });
    }

    console.log(`🗑️ Medical record deleted: ${recordId}`);

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during deletion'
    });
  }
});

/**
 * GET /api/secure-health/search
 * Search medical records
 */
router.get('/search', accessLimiter, authenticateSession, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.userId;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Search records
    const result = await SupabaseService.searchMedicalRecords(userId, q);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }

    res.json({
      success: true,
      message: `Found ${result.records?.length || 0} matching records`,
      data: {
        records: result.records || [],
        total: result.records?.length || 0,
        query: q
      }
    });

  } catch (error) {
    console.error('❌ Search endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during search'
    });
  }
});

/**
 * GET /api/secure-health/stats
 * Get system statistics
 */
router.get('/stats', accessLimiter, authenticateSession, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's records for personal stats
    const userRecords = await SupabaseService.getUserMedicalRecords(userId);
    
    // Get split-key auth stats
    const authStats = await SplitKeyAuthService.getStats();
    
    // Get IPFS stats
    const ipfsStats = IPFSStorageService.getStatus();
    
    // Get Supabase stats
    const supabaseStats = SupabaseService.getStatus();

    res.json({
      success: true,
      data: {
        personalStats: {
          totalRecords: userRecords.records?.length || 0,
          totalSize: userRecords.records?.reduce((sum, record) => sum + record.size, 0) || 0
        },
        systemStats: {
          auth: authStats,
          ipfs: ipfsStats,
          database: supabaseStats
        }
      }
    });

  } catch (error) {
    console.error('❌ Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during stats retrieval'
    });
  }
});

/**
 * POST /api/secure-health/verify-key
 * Verify split-key combination without authentication
 */
router.post('/verify-key', authLimiter, async (req, res) => {
  try {
    const { userId, clientKeyHalf } = req.body;

    if (!userId || !clientKeyHalf) {
      return res.status(400).json({
        success: false,
        error: 'User ID and client key half are required'
      });
    }

    if (!validateUserId(userId) || !validateKeyHalf(clientKeyHalf)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format'
      });
    }

    // Validate key combination
    const result = await SplitKeyAuthService.validateAndGetFullKey(userId, clientKeyHalf);

    res.json({
      success: true,
      data: {
        valid: result.valid,
        message: result.message
      }
    });

  } catch (error) {
    console.error('❌ Key verification endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during key verification'
    });
  }
});

export default router;
