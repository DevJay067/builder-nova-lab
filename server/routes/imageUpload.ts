import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configure multer for memory storage (store files in memory as Buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Middleware for handling multiple image uploads
export const uploadImages = upload.array('images', 5);

/**
 * Upload and process medical images
 */
export const handleImageUpload: RequestHandler = async (req, res) => {
  try {
    console.log("📸 Processing medical image upload");

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided",
      });
    }

    console.log(`📁 Processing ${files.length} image(s)`);

    // Process each image
    const processedImages = files.map((file, index) => {
      // Convert to base64 for secure storage
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Generate secure filename
      const fileExtension = path.extname(file.originalname);
      const secureFilename = `medical_scan_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;

      return {
        id: crypto.randomBytes(16).toString('hex'),
        originalName: file.originalname,
        secureFilename: secureFilename,
        mimeType: mimeType,
        size: file.size,
        dataUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
      };
    });

    console.log("✅ Images processed successfully");

    res.json({
      success: true,
      message: `${processedImages.length} image(s) processed successfully`,
      images: processedImages,
    });

  } catch (error) {
    console.error("❌ Error processing images:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Image processing failed",
    });
  }
};

/**
 * Simulate AI analysis of medical images
 */
export const analyzeImages: RequestHandler = async (req, res) => {
  try {
    console.log("🧠 Starting AI analysis");

    const { images, scanType } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided for analysis",
      });
    }

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock AI analysis based on scan type
    const generateAnalysis = (type: string) => {
      const baseAnalysis = {
        confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
        processedAt: new Date().toISOString(),
      };

      switch (type) {
        case 'xray':
          return {
            ...baseAnalysis,
            findings: [
              "Chest X-ray shows clear lung fields",
              "No obvious signs of pneumonia or pleural effusion",
              "Heart size appears within normal limits",
              "Bone structures intact without visible fractures"
            ],
            recommendations: [
              "Consult with radiologist for detailed interpretation",
              "Consider follow-up if symptoms persist",
              "Correlate with clinical symptoms and history"
            ],
            technicalNotes: [
              "Image quality: Adequate for diagnostic purposes",
              "Exposure parameters: Appropriate",
              "Patient positioning: Standard PA view"
            ]
          };

        case 'mri':
          return {
            ...baseAnalysis,
            findings: [
              "MRI scan shows normal brain parenchyma",
              "No evidence of acute infarction or hemorrhage",
              "Ventricular system appears normal",
              "No obvious mass lesions identified"
            ],
            recommendations: [
              "Professional radiological review recommended",
              "Clinical correlation advised",
              "Consider contrast study if indicated"
            ],
            technicalNotes: [
              "Sequence: T1 and T2 weighted images",
              "Image quality: Good diagnostic quality",
              "Artifacts: Minimal motion artifacts"
            ]
          };

        case 'dermatology':
          return {
            ...baseAnalysis,
            findings: [
              "Skin lesion appears benign in nature",
              "Regular borders and uniform coloration observed",
              "Size approximately 5-7mm in diameter",
              "No obvious signs of malignancy"
            ],
            recommendations: [
              "Dermatological consultation recommended",
              "Monitor for changes in size, color, or shape",
              "Consider dermoscopy for detailed evaluation",
              "Regular skin self-examinations advised"
            ],
            technicalNotes: [
              "Image quality: High resolution",
              "Lighting: Adequate for assessment",
              "Scale reference: Present"
            ]
          };

        default:
          return {
            ...baseAnalysis,
            findings: [
              "Medical image analyzed successfully",
              "Image quality adequate for review",
              "No immediate concerning features identified",
              "Requires professional medical interpretation"
            ],
            recommendations: [
              "Consult with appropriate medical specialist",
              "Provide clinical context for accurate interpretation",
              "Consider additional imaging if needed",
              "Follow up with healthcare provider"
            ],
            technicalNotes: [
              "Image processing: Completed",
              "Analysis algorithm: Standard medical imaging AI",
              "Quality metrics: Passed"
            ]
          };
      }
    };

    const analysis = generateAnalysis(scanType);

    console.log("✅ AI analysis completed");

    res.json({
      success: true,
      analysis: {
        ...analysis,
        imageCount: images.length,
        scanType: scanType,
        disclaimer: "This AI analysis is for informational purposes only and should not replace professional medical diagnosis. Always consult with qualified healthcare providers.",
      },
    });

  } catch (error) {
    console.error("❌ Error in AI analysis:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "AI analysis failed",
    });
  }
};
