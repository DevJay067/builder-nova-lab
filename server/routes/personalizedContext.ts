import { RequestHandler } from "express";
import { PersonalizedMedicalContextService } from "../services/personalizedMedicalContext";

/**
 * Get personalized medical context for authenticated user
 */
export const getPersonalizedMedicalContext: RequestHandler = async (
  req,
  res,
) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log("🔍 Getting personalized medical context for user");

    // Get personalized context
    const personalizedContext =
      await PersonalizedMedicalContextService.createPersonalizedContext(
        sessionToken,
      );

    // Create enhanced context for B-max AI
    const enhancedContext = {
      success: true,
      hasData: personalizedContext.hasData,
      patientId: personalizedContext.patientId,
      context: personalizedContext.contextualPrompt,
      summary: {
        totalConditions: personalizedContext.medicalConditions.length,
        chronicConditions: personalizedContext.medicalConditions.filter(
          (c) => c.type === "chronic",
        ).length,
        currentMedications: personalizedContext.currentMedications.length,
        knownAllergies: personalizedContext.allergies.length,
        recentSymptoms: personalizedContext.recentSymptoms.length,
        lastUpdate: new Date().toISOString(),
      },
      medicalConditions: personalizedContext.medicalConditions.map(
        (condition) => ({
          name: condition.name,
          type: condition.type,
          severity: condition.severity,
          lastUpdated: condition.lastUpdated,
        }),
      ),
      currentMedications: personalizedContext.currentMedications,
      allergies: personalizedContext.allergies,
      recentSymptoms: personalizedContext.recentSymptoms,
      searchEnhancers: personalizedContext.searchEnhancers,
      aiInstructions: {
        personalizationEnabled: true,
        considerConditions: personalizedContext.medicalConditions.map(
          (c) => c.name,
        ),
        medicationInteractions: personalizedContext.currentMedications,
        allergyWarnings: personalizedContext.allergies,
        contextualPrompt: personalizedContext.contextualPrompt,
      },
    };

    console.log(
      `✅ Personalized context created with ${personalizedContext.medicalConditions.length} conditions`,
    );

    res.json(enhancedContext);
  } catch (error) {
    console.error("❌ Error getting personalized medical context:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving personalized medical context",
    });
  }
};

/**
 * Enhance a query with medical context
 */
export const enhanceQueryWithContext: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    const { query, library } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log(`🔍 Enhancing query: "${query}" with medical context and library: ${library || 'default'}`);

    // Get personalized context
    const personalizedContext =
      await PersonalizedMedicalContextService.createPersonalizedContext(
        sessionToken,
      );

    // Enhance the query with library context
    const enhancement =
      PersonalizedMedicalContextService.enhanceQueryWithMedicalContext(
        query,
        personalizedContext,
        library
      );

    console.log(`✅ Query enhanced: "${enhancement.enhancedQuery}"`);

    res.json({
      success: true,
      originalQuery: enhancement.originalQuery,
      enhancedQuery: enhancement.enhancedQuery,
      relevantConditions: enhancement.relevantConditions,
      searchContext: enhancement.searchContext,
      personalizedPrompt: enhancement.personalizedPrompt,
      hasPersonalization: personalizedContext.hasData,
      libraryUsed: library || 'default',
      librariesSearched: getLibrariesForQuery(library),
    });
  } catch (error) {
    console.error("❌ Error enhancing query with context:", error);
    res.status(500).json({
      success: false,
      message: "Error enhancing query with medical context",
    });
  }
};

/**
 * Get relevant libraries for a query
 */
const getLibrariesForQuery = (selectedLibrary?: string) => {
  const allLibraries = [
    { id: 'pubmed', name: 'PubMed Medical Database', relevance: 'high' },
    { id: 'who', name: 'WHO Guidelines', relevance: 'medium' },
    { id: 'fda', name: 'FDA Drug Database', relevance: 'high' },
    { id: 'icd10', name: 'ICD-10 Codes', relevance: 'medium' },
    { id: 'personal', name: 'Personal Medical History', relevance: 'high' }
  ];

  if (selectedLibrary) {
    return allLibraries.filter(lib => lib.id === selectedLibrary);
  }

  // Return all libraries if none selected
  return allLibraries;
};

/**
 * Get personalized health insights based on medical history
 */
export const getPersonalizedInsights: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log("🔍 Generating personalized health insights");

    // Get personalized context
    const personalizedContext =
      await PersonalizedMedicalContextService.createPersonalizedContext(
        sessionToken,
      );

    if (!personalizedContext.hasData) {
      return res.json({
        success: true,
        hasInsights: false,
        message: "No medical history available for insights",
        insights: [],
      });
    }

    // Generate personalized insights
    const insights = generateHealthInsights(personalizedContext);

    console.log(`✅ Generated ${insights.length} personalized insights`);

    res.json({
      success: true,
      hasInsights: true,
      patientId: personalizedContext.patientId,
      insights,
      totalConditions: personalizedContext.medicalConditions.length,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error generating personalized insights:", error);
    res.status(500).json({
      success: false,
      message: "Error generating personalized health insights",
    });
  }
};

/**
 * Generate health insights based on medical context
 */
function generateHealthInsights(context: any): any[] {
  const insights = [];

  // Diabetes-specific insights
  const diabeticConditions = context.medicalConditions.filter(
    (c: any) =>
      c.name.toLowerCase().includes("diabetes") ||
      c.name.toLowerCase().includes("diabetic"),
  );

  if (diabeticConditions.length > 0) {
    insights.push({
      category: "Diabetes Management",
      priority: "high",
      title: "Blood Sugar Monitoring",
      description:
        "Regular blood glucose monitoring is crucial for diabetes management. Be aware that dizziness can be a sign of low or high blood sugar.",
      recommendations: [
        "Check blood sugar if experiencing dizziness or fatigue",
        "Monitor for symptoms of hypoglycemia (dizziness, sweating, confusion)",
        "Keep glucose tablets or snacks available",
        "Maintain regular meal schedule",
      ],
      relatedSymptoms: [
        "dizziness",
        "fatigue",
        "blurred vision",
        "excessive thirst",
      ],
    });
  }

  // Hypertension insights
  const hypertensionConditions = context.medicalConditions.filter(
    (c: any) =>
      c.name.toLowerCase().includes("hypertension") ||
      c.name.toLowerCase().includes("blood pressure"),
  );

  if (hypertensionConditions.length > 0) {
    insights.push({
      category: "Blood Pressure Management",
      priority: "high",
      title: "Hypertension Monitoring",
      description:
        "High blood pressure requires regular monitoring and lifestyle management. Dizziness can be related to blood pressure changes.",
      recommendations: [
        "Monitor blood pressure regularly, especially if experiencing dizziness",
        "Take medications as prescribed",
        "Limit sodium intake",
        "Maintain healthy weight and exercise regularly",
      ],
      relatedSymptoms: [
        "dizziness",
        "headache",
        "chest pain",
        "shortness of breath",
      ],
    });
  }

  // Medication interaction insights
  if (context.currentMedications.length > 0) {
    insights.push({
      category: "Medication Safety",
      priority: "medium",
      title: "Drug Interactions & Side Effects",
      description:
        "Be aware of potential side effects and interactions with your current medications.",
      recommendations: [
        "Always inform healthcare providers about all medications",
        "Check for drug interactions before starting new medications",
        "Report any unusual symptoms to your doctor",
        "Don't stop medications without consulting your healthcare provider",
      ],
      currentMedications: context.currentMedications,
      relatedSymptoms: [
        "dizziness",
        "nausea",
        "fatigue",
        "changes in mood or behavior",
      ],
    });
  }

  // Allergy management insights
  if (context.allergies.length > 0) {
    insights.push({
      category: "Allergy Management",
      priority: "high",
      title: "Allergy Precautions",
      description:
        "Stay vigilant about your known allergies and avoid triggers.",
      recommendations: [
        "Carry emergency medications if prescribed (EpiPen, antihistamines)",
        "Read food and medication labels carefully",
        "Inform all healthcare providers about your allergies",
        "Wear medical alert jewelry if allergies are severe",
      ],
      knownAllergies: context.allergies,
      relatedSymptoms: [
        "rash",
        "itching",
        "swelling",
        "difficulty breathing",
        "dizziness",
      ],
    });
  }

  // Recent symptoms insights
  if (context.recentSymptoms.length > 0) {
    insights.push({
      category: "Recent Health Patterns",
      priority: "medium",
      title: "Symptom Tracking",
      description:
        "Based on your recent symptoms, here are some monitoring recommendations.",
      recommendations: [
        "Keep a symptom diary to identify patterns",
        "Note triggers or circumstances when symptoms occur",
        "Discuss persistent or worsening symptoms with your healthcare provider",
        "Monitor how symptoms relate to your existing conditions",
      ],
      recentSymptoms: context.recentSymptoms,
    });
  }

  return insights;
}

/**
 * AI Medical Scan endpoint
 */
export const performAIScan: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    const { query, scanTypes = ["symptoms", "medications", "conditions", "allergies"] } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log(`🔍 Performing AI scan on query: "${query}"`);

    // Get personalized context for enhanced scanning
    const personalizedContext =
      await PersonalizedMedicalContextService.createPersonalizedContext(
        sessionToken,
      );

    // Perform AI scanning with different analysis types
    const scanResults = await Promise.all(
      scanTypes.map(async (scanType) => {
        const result = await performScanAnalysis(query, scanType, personalizedContext);
        return {
          id: `scan-${Date.now()}-${scanType}`,
          type: scanType,
          confidence: result.confidence,
          data: result.data,
          timestamp: new Date().toISOString(),
        };
      })
    );

    console.log(`✅ AI scan completed with ${scanResults.length} results`);

    res.json({
      success: true,
      query,
      scanResults,
      totalScans: scanResults.length,
      hasPersonalization: personalizedContext.hasData,
    });
  } catch (error) {
    console.error("❌ Error performing AI scan:", error);
    res.status(500).json({
      success: false,
      message: "Error performing AI scan",
    });
  }
};

/**
 * Perform specific scan analysis
 */
const performScanAnalysis = async (
  query: string,
  scanType: string,
  personalizedContext: any
) => {
  const queryLower = query.toLowerCase();
  
  switch (scanType) {
    case "symptoms":
      return analyzeSymptoms(queryLower, personalizedContext);
    case "medications":
      return analyzeMedications(queryLower, personalizedContext);
    case "conditions":
      return analyzeConditions(queryLower, personalizedContext);
    case "allergies":
      return analyzeAllergies(queryLower, personalizedContext);
    default:
      return {
        confidence: 0.5,
        data: {
          detected: false,
          details: `No analysis available for ${scanType}`,
          recommendations: []
        }
      };
  }
};

const analyzeSymptoms = (query: string, context: any) => {
  const symptomKeywords = [
    "dizzy", "dizziness", "headache", "pain", "fatigue", "tired",
    "nausea", "vomiting", "fever", "cough", "shortness of breath",
    "chest pain", "abdominal pain", "back pain"
  ];
  
  const detectedSymptoms = symptomKeywords.filter(symptom => 
    query.includes(symptom)
  );
  
  const confidence = detectedSymptoms.length > 0 ? 0.8 : 0.3;
  
  return {
    confidence,
    data: {
      detected: detectedSymptoms.length > 0,
      details: detectedSymptoms.length > 0 
        ? `Detected symptoms: ${detectedSymptoms.join(", ")}`
        : "No specific symptoms detected in query",
      recommendations: detectedSymptoms.length > 0 
        ? ["Consider symptom severity assessment", "Monitor for related symptoms"]
        : ["Query appears to be general health question"]
    }
  };
};

const analyzeMedications = (query: string, context: any) => {
  const medicationKeywords = [
    "medication", "medicine", "pill", "drug", "prescription",
    "ibuprofen", "aspirin", "acetaminophen", "tylenol", "advil"
  ];
  
  const detectedMedications = medicationKeywords.filter(med => 
    query.includes(med)
  );
  
  const confidence = detectedMedications.length > 0 ? 0.9 : 0.2;
  
  return {
    confidence,
    data: {
      detected: detectedMedications.length > 0,
      details: detectedMedications.length > 0 
        ? `Medication-related query detected: ${detectedMedications.join(", ")}`
        : "No medication-specific content detected",
      recommendations: detectedMedications.length > 0 
        ? ["Check for drug interactions", "Verify dosage recommendations"]
        : ["Query may benefit from medication context"]
    }
  };
};

const analyzeConditions = (query: string, context: any) => {
  const conditionKeywords = [
    "diabetes", "hypertension", "asthma", "heart disease",
    "cancer", "arthritis", "depression", "anxiety"
  ];
  
  const detectedConditions = conditionKeywords.filter(condition => 
    query.includes(condition)
  );
  
  // Check against personal medical history
  const personalConditions = context.medicalConditions?.map((c: any) => 
    c.name.toLowerCase()
  ) || [];
  
  const relevantPersonalConditions = personalConditions.filter((condition: string) =>
    query.includes(condition)
  );
  
  const confidence = (detectedConditions.length + relevantPersonalConditions.length) > 0 ? 0.85 : 0.4;
  
  return {
    confidence,
    data: {
      detected: (detectedConditions.length + relevantPersonalConditions.length) > 0,
      details: (detectedConditions.length + relevantPersonalConditions.length) > 0 
        ? `Conditions mentioned: ${[...detectedConditions, ...relevantPersonalConditions].join(", ")}`
        : "No specific medical conditions detected",
      recommendations: (detectedConditions.length + relevantPersonalConditions.length) > 0 
        ? ["Consider condition-specific advice", "Review treatment guidelines"]
        : ["Query may benefit from condition context"]
    }
  };
};

const analyzeAllergies = (query: string, context: any) => {
  const allergyKeywords = [
    "allergy", "allergic", "reaction", "penicillin", "peanuts",
    "shellfish", "latex", "pollen", "dust"
  ];
  
  const detectedAllergies = allergyKeywords.filter(allergy => 
    query.includes(allergy)
  );
  
  // Check against personal allergies
  const personalAllergies = context.allergies || [];
  const relevantPersonalAllergies = personalAllergies.filter((allergy: string) =>
    query.includes(allergy.toLowerCase())
  );
  
  const confidence = (detectedAllergies.length + relevantPersonalAllergies.length) > 0 ? 0.9 : 0.2;
  
  return {
    confidence,
    data: {
      detected: (detectedAllergies.length + relevantPersonalAllergies.length) > 0,
      details: (detectedAllergies.length + relevantPersonalAllergies.length) > 0 
        ? `Allergy-related content: ${[...detectedAllergies, ...relevantPersonalAllergies].join(", ")}`
        : "No allergy-specific content detected",
      recommendations: (detectedAllergies.length + relevantPersonalAllergies.length) > 0 
        ? ["Consider allergy precautions", "Review medication safety"]
        : ["Query may benefit from allergy screening"]
    }
  };
};
