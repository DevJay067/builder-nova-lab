import { RequestHandler } from "express";
import { PersonalizedMedicalContextService } from "../services/personalizedMedicalContext";

/**
 * Get personalized medical context for authenticated user
 */
export const getPersonalizedMedicalContext: RequestHandler = async (req, res) => {
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
    const personalizedContext = await PersonalizedMedicalContextService.createPersonalizedContext(sessionToken);

    // Create enhanced context for B-max AI
    const enhancedContext = {
      success: true,
      hasData: personalizedContext.hasData,
      patientId: personalizedContext.patientId,
      context: personalizedContext.contextualPrompt,
      summary: {
        totalConditions: personalizedContext.medicalConditions.length,
        chronicConditions: personalizedContext.medicalConditions.filter(c => c.type === 'chronic').length,
        currentMedications: personalizedContext.currentMedications.length,
        knownAllergies: personalizedContext.allergies.length,
        recentSymptoms: personalizedContext.recentSymptoms.length,
        lastUpdate: new Date().toISOString(),
      },
      medicalConditions: personalizedContext.medicalConditions.map(condition => ({
        name: condition.name,
        type: condition.type,
        severity: condition.severity,
        lastUpdated: condition.lastUpdated
      })),
      currentMedications: personalizedContext.currentMedications,
      allergies: personalizedContext.allergies,
      recentSymptoms: personalizedContext.recentSymptoms,
      searchEnhancers: personalizedContext.searchEnhancers,
      aiInstructions: {
        personalizationEnabled: true,
        considerConditions: personalizedContext.medicalConditions.map(c => c.name),
        medicationInteractions: personalizedContext.currentMedications,
        allergyWarnings: personalizedContext.allergies,
        contextualPrompt: personalizedContext.contextualPrompt
      }
    };

    console.log(`✅ Personalized context created with ${personalizedContext.medicalConditions.length} conditions`);

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

    const { query } = req.body;

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

    console.log(`🔍 Enhancing query: "${query}" with medical context`);

    // Get personalized context
    const personalizedContext = await PersonalizedMedicalContextService.createPersonalizedContext(sessionToken);

    // Enhance the query
    const enhancement = PersonalizedMedicalContextService.enhanceQueryWithMedicalContext(
      query, 
      personalizedContext
    );

    console.log(`✅ Query enhanced: "${enhancement.enhancedQuery}"`);

    res.json({
      success: true,
      originalQuery: enhancement.originalQuery,
      enhancedQuery: enhancement.enhancedQuery,
      relevantConditions: enhancement.relevantConditions,
      searchContext: enhancement.searchContext,
      personalizedPrompt: enhancement.personalizedPrompt,
      hasPersonalization: personalizedContext.hasData
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
    const personalizedContext = await PersonalizedMedicalContextService.createPersonalizedContext(sessionToken);

    if (!personalizedContext.hasData) {
      return res.json({
        success: true,
        hasInsights: false,
        message: "No medical history available for insights",
        insights: []
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
      lastUpdate: new Date().toISOString()
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
  const diabeticConditions = context.medicalConditions.filter((c: any) => 
    c.name.toLowerCase().includes('diabetes') || c.name.toLowerCase().includes('diabetic')
  );
  
  if (diabeticConditions.length > 0) {
    insights.push({
      category: "Diabetes Management",
      priority: "high",
      title: "Blood Sugar Monitoring",
      description: "Regular blood glucose monitoring is crucial for diabetes management. Be aware that dizziness can be a sign of low or high blood sugar.",
      recommendations: [
        "Check blood sugar if experiencing dizziness or fatigue",
        "Monitor for symptoms of hypoglycemia (dizziness, sweating, confusion)",
        "Keep glucose tablets or snacks available",
        "Maintain regular meal schedule"
      ],
      relatedSymptoms: ["dizziness", "fatigue", "blurred vision", "excessive thirst"]
    });
  }

  // Hypertension insights
  const hypertensionConditions = context.medicalConditions.filter((c: any) => 
    c.name.toLowerCase().includes('hypertension') || c.name.toLowerCase().includes('blood pressure')
  );

  if (hypertensionConditions.length > 0) {
    insights.push({
      category: "Blood Pressure Management",
      priority: "high",
      title: "Hypertension Monitoring",
      description: "High blood pressure requires regular monitoring and lifestyle management. Dizziness can be related to blood pressure changes.",
      recommendations: [
        "Monitor blood pressure regularly, especially if experiencing dizziness",
        "Take medications as prescribed",
        "Limit sodium intake",
        "Maintain healthy weight and exercise regularly"
      ],
      relatedSymptoms: ["dizziness", "headache", "chest pain", "shortness of breath"]
    });
  }

  // Medication interaction insights
  if (context.currentMedications.length > 0) {
    insights.push({
      category: "Medication Safety",
      priority: "medium",
      title: "Drug Interactions & Side Effects",
      description: "Be aware of potential side effects and interactions with your current medications.",
      recommendations: [
        "Always inform healthcare providers about all medications",
        "Check for drug interactions before starting new medications",
        "Report any unusual symptoms to your doctor",
        "Don't stop medications without consulting your healthcare provider"
      ],
      currentMedications: context.currentMedications,
      relatedSymptoms: ["dizziness", "nausea", "fatigue", "changes in mood or behavior"]
    });
  }

  // Allergy management insights
  if (context.allergies.length > 0) {
    insights.push({
      category: "Allergy Management",
      priority: "high",
      title: "Allergy Precautions",
      description: "Stay vigilant about your known allergies and avoid triggers.",
      recommendations: [
        "Carry emergency medications if prescribed (EpiPen, antihistamines)",
        "Read food and medication labels carefully",
        "Inform all healthcare providers about your allergies",
        "Wear medical alert jewelry if allergies are severe"
      ],
      knownAllergies: context.allergies,
      relatedSymptoms: ["rash", "itching", "swelling", "difficulty breathing", "dizziness"]
    });
  }

  // Recent symptoms insights
  if (context.recentSymptoms.length > 0) {
    insights.push({
      category: "Recent Health Patterns",
      priority: "medium",
      title: "Symptom Tracking",
      description: "Based on your recent symptoms, here are some monitoring recommendations.",
      recommendations: [
        "Keep a symptom diary to identify patterns",
        "Note triggers or circumstances when symptoms occur",
        "Discuss persistent or worsening symptoms with your healthcare provider",
        "Monitor how symptoms relate to your existing conditions"
      ],
      recentSymptoms: context.recentSymptoms
    });
  }

  return insights;
}
