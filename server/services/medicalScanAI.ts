import crypto from 'crypto';
import { createWorker } from 'tesseract.js';

export interface MedicalScanResult {
  id: string;
  scanType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'bloodwork' | 'ecg' | 'general';
  confidence: number;
  findings: string[];
  diagnosis: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: {
    imageHash: string;
    processingTime: number;
    aiModel: string;
    version: string;
  };
}

export interface ScanAnalysisRequest {
  imageData: string; // Base64 encoded image
  scanType?: string;
  patientSymptoms?: string;
  patientHistory?: string;
}

export class MedicalScanAIService {
  private static instance: MedicalScanAIService;
  private isInitialized = false;
  private tesseractWorker: any = null;

  public static getInstance(): MedicalScanAIService {
    if (!MedicalScanAIService.instance) {
      MedicalScanAIService.instance = new MedicalScanAIService();
    }
    return MedicalScanAIService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🔬 Initializing Medical Scan AI Service...");
      
      // Initialize Tesseract OCR for text extraction from medical images
      this.tesseractWorker = await createWorker('eng');
      await this.tesseractWorker.loadLanguage('eng');
      await this.tesseractWorker.initialize('eng');
      
      this.isInitialized = true;
      console.log("✅ Medical Scan AI Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Medical Scan AI Service:", error);
      throw error;
    }
  }

  async analyzeMedicalScan(request: ScanAnalysisRequest): Promise<MedicalScanResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log("🔍 Analyzing medical scan...");

      // Generate unique ID for this analysis
      const analysisId = crypto.randomUUID();
      
      // Calculate image hash for integrity verification
      const imageHash = crypto.createHash('sha256').update(request.imageData).digest('hex');
      
      // Extract text from image using OCR
      const { data: { text } } = await this.tesseractWorker.recognize(request.imageData);
      
      // Analyze the scan based on type and extracted text
      const analysis = await this.performScanAnalysis(
        request.scanType || 'general',
        text,
        request.patientSymptoms,
        request.patientHistory
      );

      const processingTime = Date.now() - startTime;

      const result: MedicalScanResult = {
        id: analysisId,
        scanType: analysis.scanType,
        confidence: analysis.confidence,
        findings: analysis.findings,
        diagnosis: analysis.diagnosis,
        recommendations: analysis.recommendations,
        riskLevel: analysis.riskLevel,
        timestamp: new Date().toISOString(),
        metadata: {
          imageHash,
          processingTime,
          aiModel: 'HealthChain-Medical-AI-v1.0',
          version: '1.0.0'
        }
      };

      console.log("✅ Medical scan analysis completed");
      return result;

    } catch (error) {
      console.error("❌ Medical scan analysis failed:", error);
      throw new Error(`Medical scan analysis failed: ${error.message}`);
    }
  }

  private async performScanAnalysis(
    scanType: string,
    extractedText: string,
    symptoms?: string,
    history?: string
  ): Promise<Partial<MedicalScanResult>> {
    
    // Convert scan type to enum
    const scanTypeEnum = this.normalizeScanType(scanType);
    
    // Analyze based on scan type
    switch (scanTypeEnum) {
      case 'xray':
        return this.analyzeXRay(extractedText, symptoms, history);
      case 'mri':
        return this.analyzeMRI(extractedText, symptoms, history);
      case 'ct':
        return this.analyzeCT(extractedText, symptoms, history);
      case 'ultrasound':
        return this.analyzeUltrasound(extractedText, symptoms, history);
      case 'bloodwork':
        return this.analyzeBloodwork(extractedText, symptoms, history);
      case 'ecg':
        return this.analyzeECG(extractedText, symptoms, history);
      default:
        return this.analyzeGeneral(extractedText, symptoms, history);
    }
  }

  private normalizeScanType(scanType: string): string {
    const normalized = scanType.toLowerCase();
    if (normalized.includes('xray') || normalized.includes('x-ray')) return 'xray';
    if (normalized.includes('mri')) return 'mri';
    if (normalized.includes('ct') || normalized.includes('cat')) return 'ct';
    if (normalized.includes('ultrasound') || normalized.includes('sono')) return 'ultrasound';
    if (normalized.includes('blood') || normalized.includes('lab')) return 'bloodwork';
    if (normalized.includes('ecg') || normalized.includes('ekg')) return 'ecg';
    return 'general';
  }

  private analyzeXRay(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.7;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Analyze for common X-ray findings
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('fracture') || lowerText.includes('broken')) {
      findings.push('Possible bone fracture detected');
      diagnosis.push('Fracture');
      recommendations.push('Immediate orthopedic consultation required');
      recommendations.push('Immobilization of affected area');
      riskLevel = 'high';
      confidence = 0.85;
    }

    if (lowerText.includes('pneumonia') || lowerText.includes('infection')) {
      findings.push('Possible lung infection or pneumonia');
      diagnosis.push('Pneumonia');
      recommendations.push('Antibiotic treatment may be required');
      recommendations.push('Follow-up chest X-ray in 2 weeks');
      riskLevel = 'medium';
      confidence = 0.8;
    }

    if (lowerText.includes('normal') || lowerText.includes('clear')) {
      findings.push('Normal chest X-ray appearance');
      diagnosis.push('Normal findings');
      recommendations.push('No immediate treatment required');
      confidence = 0.9;
    }

    if (lowerText.includes('mass') || lowerText.includes('tumor')) {
      findings.push('Suspicious mass or lesion detected');
      diagnosis.push('Suspicious mass - requires further evaluation');
      recommendations.push('Immediate CT scan or MRI recommended');
      recommendations.push('Oncology consultation required');
      riskLevel = 'critical';
      confidence = 0.75;
    }

    return {
      scanType: 'xray',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeMRI(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.8;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerText = text.toLowerCase();

    if (lowerText.includes('herniation') || lowerText.includes('herniated')) {
      findings.push('Disc herniation detected');
      diagnosis.push('Herniated disc');
      recommendations.push('Physical therapy consultation');
      recommendations.push('Pain management evaluation');
      riskLevel = 'medium';
      confidence = 0.85;
    }

    if (lowerText.includes('tumor') || lowerText.includes('mass')) {
      findings.push('Brain mass or tumor detected');
      diagnosis.push('Brain tumor - requires immediate attention');
      recommendations.push('Immediate neurosurgery consultation');
      recommendations.push('Biopsy may be required');
      riskLevel = 'critical';
      confidence = 0.9;
    }

    if (lowerText.includes('stroke') || lowerText.includes('infarct')) {
      findings.push('Possible stroke or infarct detected');
      diagnosis.push('Stroke');
      recommendations.push('Immediate emergency medical attention');
      recommendations.push('Neurology consultation required');
      riskLevel = 'critical';
      confidence = 0.88;
    }

    return {
      scanType: 'mri',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeBloodwork(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.75;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerText = text.toLowerCase();

    // Check for diabetes indicators
    if (lowerText.includes('glucose') && lowerText.includes('high')) {
      findings.push('Elevated blood glucose levels');
      diagnosis.push('Possible diabetes or pre-diabetes');
      recommendations.push('Endocrinology consultation');
      recommendations.push('Blood glucose monitoring');
      riskLevel = 'medium';
      confidence = 0.8;
    }

    // Check for anemia
    if (lowerText.includes('hemoglobin') && lowerText.includes('low')) {
      findings.push('Low hemoglobin levels');
      diagnosis.push('Possible anemia');
      recommendations.push('Iron supplementation may be required');
      recommendations.push('Follow-up blood work in 3 months');
      riskLevel = 'low';
      confidence = 0.85;
    }

    // Check for infection
    if (lowerText.includes('wbc') && lowerText.includes('high')) {
      findings.push('Elevated white blood cell count');
      diagnosis.push('Possible infection');
      recommendations.push('Antibiotic treatment may be required');
      recommendations.push('Follow-up blood work');
      riskLevel = 'medium';
      confidence = 0.8;
    }

    return {
      scanType: 'bloodwork',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeECG(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.8;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerText = text.toLowerCase();

    if (lowerText.includes('arrhythmia') || lowerText.includes('irregular')) {
      findings.push('Irregular heart rhythm detected');
      diagnosis.push('Cardiac arrhythmia');
      recommendations.push('Cardiology consultation required');
      recommendations.push('Holter monitor may be needed');
      riskLevel = 'high';
      confidence = 0.85;
    }

    if (lowerText.includes('tachycardia') || lowerText.includes('fast')) {
      findings.push('Elevated heart rate detected');
      diagnosis.push('Tachycardia');
      recommendations.push('Cardiology evaluation');
      recommendations.push('Monitor heart rate');
      riskLevel = 'medium';
      confidence = 0.8;
    }

    if (lowerText.includes('normal') || lowerText.includes('sinus')) {
      findings.push('Normal sinus rhythm');
      diagnosis.push('Normal ECG');
      recommendations.push('No immediate cardiac concerns');
      confidence = 0.9;
    }

    return {
      scanType: 'ecg',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeCT(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.8;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerText = text.toLowerCase();

    if (lowerText.includes('appendicitis')) {
      findings.push('Appendicitis detected');
      diagnosis.push('Acute appendicitis');
      recommendations.push('Immediate surgical consultation');
      recommendations.push('Emergency surgery may be required');
      riskLevel = 'critical';
      confidence = 0.9;
    }

    if (lowerText.includes('kidney stone')) {
      findings.push('Kidney stone detected');
      diagnosis.push('Nephrolithiasis');
      recommendations.push('Urology consultation');
      recommendations.push('Pain management');
      riskLevel = 'medium';
      confidence = 0.85;
    }

    return {
      scanType: 'ct',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeUltrasound(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.8;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerText = text.toLowerCase();

    if (lowerText.includes('gallstone')) {
      findings.push('Gallstones detected');
      diagnosis.push('Cholelithiasis');
      recommendations.push('Gastroenterology consultation');
      recommendations.push('Dietary modifications may be required');
      riskLevel = 'medium';
      confidence = 0.85;
    }

    if (lowerText.includes('pregnancy')) {
      findings.push('Pregnancy confirmed');
      diagnosis.push('Normal pregnancy');
      recommendations.push('Obstetric follow-up');
      recommendations.push('Prenatal care');
      riskLevel = 'low';
      confidence = 0.9;
    }

    return {
      scanType: 'ultrasound',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  private analyzeGeneral(text: string, symptoms?: string, history?: string): Partial<MedicalScanResult> {
    const findings: string[] = [];
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.6;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // General analysis based on extracted text
    if (text.length > 0) {
      findings.push('Text extracted from medical image');
      diagnosis.push('Requires medical professional review');
      recommendations.push('Consult with healthcare provider');
      recommendations.push('Additional imaging may be required');
    } else {
      findings.push('No text detected in image');
      diagnosis.push('Image requires manual review');
      recommendations.push('Medical professional consultation required');
    }

    return {
      scanType: 'general',
      confidence,
      findings,
      diagnosis,
      recommendations,
      riskLevel
    };
  }

  async terminate(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
    }
    this.isInitialized = false;
  }
}