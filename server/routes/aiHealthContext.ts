import { RequestHandler } from "express";
import { UserAuthenticationService } from "../services/userAuthentication";
import { SupabaseService } from "../services/supabaseService";

/**
 * Get comprehensive health data for AI personalization
 */
export const getHealthDataForAI: RequestHandler = async (req, res) => {
  try {
    console.log("🤖 AI health context request received");

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

    // Verify session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    console.log("🔍 Fetching health records for AI context...");

    // Get health records from Supabase
    const healthRecordsResult =
      await SupabaseService.getHealthRecords("authenticated-user");

    if (!healthRecordsResult.success) {
      console.error(
        "❌ Failed to fetch health records:",
        healthRecordsResult.error,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch health records",
        error: healthRecordsResult.error,
      });
    }

    const healthRecords = healthRecordsResult.records || [];
    console.log(
      `📊 Found ${healthRecords.length} health records for AI processing`,
    );

    // Process and format health data for AI consumption
    const aiHealthContext = formatHealthDataForAI(healthRecords);

    console.log(
      `✅ AI health context prepared with ${aiHealthContext.totalRecords} records`,
    );

    res.json({
      success: true,
      context: aiHealthContext,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching health data for AI:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Format health records for AI consumption
 */
function formatHealthDataForAI(healthRecords: any[]) {
  console.log(
    `🔄 Processing ${healthRecords.length} health records for AI context`,
  );

  if (!Array.isArray(healthRecords)) {
    console.error("❌ healthRecords is not an array:", typeof healthRecords);
    return {
      totalRecords: 0,
      lastRecordDate: null,
      medicalProfile: {
        conditions: [],
        currentMedications: [],
        recentSymptoms: [],
        chronicConditions: [],
      },
      recentActivity: { records: [], vitalSigns: [], labResults: [] },
      aiPromptContext: {
        medicalHistory: {
          conditions: "No records",
          medications: "No records",
          recentSymptoms: "No records",
        },
        recentActivity: "No records",
        instructions: "No health records available",
      },
      searchEnhancers: [],
    };
  }

  const conditions: string[] = [];
  const medications: string[] = [];
  const symptoms: string[] = [];
  const vitalSigns: any[] = [];
  const labResults: any[] = [];
  const recentRecords: any[] = [];

  // Process each health record
  healthRecords.forEach((record) => {
    try {
      // Parse cloud vault data if available
      let recordData = record.data || {};
      if (typeof recordData === "string") {
        recordData = JSON.parse(recordData);
      }

      // Extract conditions and diagnoses
      if (
        record.record_type === "diagnosis" ||
        record.record_type === "condition"
      ) {
        if (record.title && !conditions.includes(record.title)) {
          conditions.push(record.title);
        }
        if (
          recordData.diagnosis &&
          !conditions.includes(recordData.diagnosis)
        ) {
          conditions.push(recordData.diagnosis);
        }
      }

      // Extract medications
      if (
        record.record_type === "medication" ||
        record.record_type === "prescription"
      ) {
        if (record.title && !medications.includes(record.title)) {
          medications.push(record.title);
        }
        if (
          recordData.medication &&
          !medications.includes(recordData.medication)
        ) {
          medications.push(recordData.medication);
        }
      }

      // Extract symptoms
      if (
        record.record_type === "symptom" ||
        record.record_type === "consultation"
      ) {
        if (recordData.symptoms) {
          const symptomList = Array.isArray(recordData.symptoms)
            ? recordData.symptoms
            : recordData.symptoms.split(",").map((s: string) => s.trim());
          symptomList.forEach((symptom: string) => {
            if (symptom && !symptoms.includes(symptom)) {
              symptoms.push(symptom);
            }
          });
        }
        if (
          record.description &&
          record.description.toLowerCase().includes("pain")
        ) {
          symptoms.push(`${record.title} - ${record.description}`);
        }
      }

      // Extract vital signs
      if (record.record_type === "vitals" || record.record_type === "checkup") {
        vitalSigns.push({
          date: record.date || record.created_at,
          type: record.title,
          values: recordData,
        });
      }

      // Extract lab results
      if (record.record_type === "lab" || record.record_type === "test") {
        labResults.push({
          date: record.date || record.created_at,
          test: record.title,
          results: recordData,
        });
      }

      // Keep recent records (last 30 days)
      const recordDate = new Date(record.date || record.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (recordDate > thirtyDaysAgo) {
        recentRecords.push({
          date: record.date || record.created_at,
          type: record.record_type,
          title: record.title,
          description: record.description,
        });
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse health record:", parseError);
    }
  });

  // Create comprehensive AI context
  const aiContext = {
    totalRecords: healthRecords.length,
    lastRecordDate:
      healthRecords.length > 0
        ? healthRecords.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0].created_at
        : null,

    // Medical profile
    medicalProfile: {
      conditions: conditions.slice(0, 10), // Limit to most relevant
      currentMedications: medications.slice(0, 10),
      recentSymptoms: symptoms.slice(0, 10),
      chronicConditions: conditions.filter(
        (c) =>
          c.toLowerCase().includes("diabetes") ||
          c.toLowerCase().includes("hypertension") ||
          c.toLowerCase().includes("chronic") ||
          c.toLowerCase().includes("asthma"),
      ),
    },

    // Recent activity
    recentActivity: {
      records: recentRecords.slice(0, 5),
      vitalSigns: vitalSigns.slice(-3), // Last 3 vital sign records
      labResults: labResults.slice(-3), // Last 3 lab results
    },

    // AI-specific formatting
    aiPromptContext: generateAIPromptContext(
      conditions,
      medications,
      symptoms,
      recentRecords,
    ),

    // Search enhancers for better AI responses
    searchEnhancers: [
      ...conditions.map((c) => `condition:${c}`),
      ...medications.map((m) => `medication:${m}`),
      ...symptoms.map((s) => `symptom:${s}`),
    ].slice(0, 20),
  };

  return aiContext;
}

/**
 * Generate AI prompt context based on health data
 */
function generateAIPromptContext(
  conditions: string[],
  medications: string[],
  symptoms: string[],
  recentRecords: any[],
) {
  const context = {
    medicalHistory: {
      conditions:
        conditions.length > 0 ? conditions.join(", ") : "No known conditions",
      medications:
        medications.length > 0
          ? medications.join(", ")
          : "No current medications",
      recentSymptoms:
        symptoms.length > 0
          ? symptoms.slice(0, 5).join(", ")
          : "No recent symptoms reported",
    },

    recentActivity:
      recentRecords.length > 0
        ? recentRecords
            .map((r) => `${r.date}: ${r.title} (${r.type})`)
            .join("; ")
        : "No recent health records",

    instructions: `
PERSONALIZED MEDICAL CONTEXT FROM HEALTH RECORDS:
- Patient has ${conditions.length} documented condition(s): ${conditions.slice(0, 5).join(", ")}
- Currently taking ${medications.length} medication(s): ${medications.slice(0, 5).join(", ")}
- Recent symptoms/concerns: ${symptoms.slice(0, 3).join(", ")}
- Last health activity: ${recentRecords.length > 0 ? recentRecords[0].date : "No recent records"}

CRITICAL AI INSTRUCTIONS:
1. Always reference the patient's documented conditions when providing advice
2. Consider medication interactions with current prescriptions: ${medications.join(", ")}
3. Be specific about how recommendations relate to documented health history
4. Prioritize safety - recommend medical consultation for concerning symptoms
5. Provide evidence-based advice considering the patient's specific medical profile

When patient asks about symptoms, immediately correlate with their documented conditions and provide targeted advice.
    `.trim(),
  };

  return context;
}

/**
 * Search health records with AI-enhanced queries
 */
export const searchHealthRecordsForAI: RequestHandler = async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

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

    // Verify session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    console.log(`🔍 AI health search: "${query}"`);

    // Get all health records
    const allRecordsResult =
      await SupabaseService.getHealthRecords("authenticated-user");

    if (!allRecordsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch health records for search",
        error: allRecordsResult.error,
      });
    }

    const allRecords = allRecordsResult.records || [];

    // Simple search implementation
    const searchResults = allRecords
      .filter((record) => {
        const searchText =
          `${record.title} ${record.description} ${record.record_type}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
      .slice(0, limit);

    const formattedResults = searchResults.map((record) => ({
      id: record.id,
      type: record.record_type,
      title: record.title,
      description: record.description,
      date: record.date || record.created_at,
      relevance: calculateRelevance(record, query),
    }));

    res.json({
      success: true,
      query,
      results: formattedResults,
      totalFound: searchResults.length,
    });
  } catch (error) {
    console.error("❌ Error searching health records for AI:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(record: any, query: string): number {
  const queryWords = query.toLowerCase().split(" ");
  let score = 0;

  const text =
    `${record.title} ${record.description} ${record.record_type}`.toLowerCase();

  queryWords.forEach((word) => {
    if (text.includes(word)) {
      score += 1;
      // Boost score for title matches
      if (record.title?.toLowerCase().includes(word)) {
        score += 2;
      }
    }
  });

  return score;
}
