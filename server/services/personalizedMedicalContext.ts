import { UserAuthenticationService } from "./userAuthentication";

/**
 * Personalized Medical Context Service
 * 
 * This service extracts medical conditions from user's health records
 * and creates contextual search queries for B-max AI to provide
 * personalized health recommendations.
 */

export interface MedicalCondition {
  name: string;
  type: 'chronic' | 'acute' | 'medication' | 'allergy' | 'symptom';
  severity?: 'mild' | 'moderate' | 'severe';
  firstReported?: string;
  lastUpdated?: string;
  details?: string;
}

export interface PersonalizedContext {
  hasData: boolean;
  patientId: string;
  medicalConditions: MedicalCondition[];
  currentMedications: string[];
  allergies: string[];
  recentSymptoms: string[];
  contextualPrompt: string;
  searchEnhancers: string[];
}

export interface AIQueryEnhancement {
  originalQuery: string;
  enhancedQuery: string;
  relevantConditions: string[];
  searchContext: string;
  personalizedPrompt: string;
}

class PersonalizedMedicalContextService {

  /**
   * Extract medical conditions from health records
   */
  static extractMedicalConditions(healthRecords: any[]): MedicalCondition[] {
    const conditions: MedicalCondition[] = [];

    healthRecords.forEach(record => {
      if (record.metadata) {
        // Extract chronic conditions
        if (record.metadata.chronicConditions) {
          record.metadata.chronicConditions.forEach((condition: string) => {
            conditions.push({
              name: condition,
              type: 'chronic',
              severity: this.determineSeverity(condition),
              firstReported: record.date,
              lastUpdated: record.date,
              details: record.description
            });
          });
        }

        // Extract medications (which indicate conditions)
        if (record.metadata.medications) {
          record.metadata.medications.forEach((medication: string) => {
            const condition = this.inferConditionFromMedication(medication);
            if (condition) {
              conditions.push({
                name: condition,
                type: 'medication',
                firstReported: record.date,
                lastUpdated: record.date,
                details: `Inferred from medication: ${medication}`
              });
            }
          });
        }

        // Extract symptoms from descriptions
        const symptoms = this.extractSymptomsFromText(record.description + ' ' + (record.metadata.notes || ''));
        symptoms.forEach(symptom => {
          conditions.push({
            name: symptom,
            type: 'symptom',
            firstReported: record.date,
            lastUpdated: record.date,
            details: record.description
          });
        });
      }
    });

    // Deduplicate and merge similar conditions
    return this.deduplicateConditions(conditions);
  }

  /**
   * Infer medical conditions from medications
   */
  private static inferConditionFromMedication(medication: string): string | null {
    const medicationToCondition: { [key: string]: string } = {
      'lisinopril': 'hypertension',
      'metformin': 'diabetes',
      'insulin': 'diabetes',
      'atorvastatin': 'high cholesterol',
      'simvastatin': 'high cholesterol',
      'amlodipine': 'hypertension',
      'losartan': 'hypertension',
      'hydrochlorothiazide': 'hypertension',
      'albuterol': 'asthma',
      'levothyroxine': 'hypothyroidism',
      'warfarin': 'blood clotting disorder',
      'aspirin': 'cardiovascular disease',
      'ibuprofen': 'pain/inflammation',
      'omeprazole': 'acid reflux',
      'sertraline': 'depression',
      'fluoxetine': 'depression',
      'alprazolam': 'anxiety'
    };

    const medicationLower = medication.toLowerCase();
    for (const [med, condition] of Object.entries(medicationToCondition)) {
      if (medicationLower.includes(med)) {
        return condition;
      }
    }
    return null;
  }

  /**
   * Extract symptoms from text descriptions
   */
  private static extractSymptomsFromText(text: string): string[] {
    const symptoms: string[] = [];
    const symptomKeywords = [
      'dizzy', 'dizziness', 'headache', 'fatigue', 'tired', 'pain', 'ache',
      'nausea', 'vomiting', 'fever', 'cough', 'shortness of breath',
      'chest pain', 'abdominal pain', 'back pain', 'joint pain',
      'swelling', 'rash', 'itching', 'blurred vision', 'numbness',
      'tingling', 'weight loss', 'weight gain', 'frequent urination',
      'excessive thirst', 'difficulty sleeping', 'anxiety', 'depression'
    ];

    const textLower = text.toLowerCase();
    symptomKeywords.forEach(symptom => {
      if (textLower.includes(symptom)) {
        symptoms.push(symptom);
      }
    });

    return symptoms;
  }

  /**
   * Determine severity of a condition
   */
  private static determineSeverity(condition: string): 'mild' | 'moderate' | 'severe' {
    const severityIndicators = {
      mild: ['mild', 'slight', 'minor', 'low'],
      moderate: ['moderate', 'medium'],
      severe: ['severe', 'high', 'major', 'acute', 'critical']
    };

    const conditionLower = condition.toLowerCase();
    
    for (const [severity, indicators] of Object.entries(severityIndicators)) {
      if (indicators.some(indicator => conditionLower.includes(indicator))) {
        return severity as 'mild' | 'moderate' | 'severe';
      }
    }

    return 'moderate'; // Default
  }

  /**
   * Deduplicate and merge similar conditions
   */
  private static deduplicateConditions(conditions: MedicalCondition[]): MedicalCondition[] {
    const conditionMap = new Map<string, MedicalCondition>();

    conditions.forEach(condition => {
      const key = condition.name.toLowerCase();
      const existing = conditionMap.get(key);

      if (existing) {
        // Update with most recent information
        if (condition.lastUpdated && (!existing.lastUpdated || condition.lastUpdated > existing.lastUpdated)) {
          existing.lastUpdated = condition.lastUpdated;
          existing.details = condition.details;
        }
      } else {
        conditionMap.set(key, condition);
      }
    });

    return Array.from(conditionMap.values());
  }

  /**
   * Create personalized context for authenticated user
   */
  static async createPersonalizedContext(sessionToken: string): Promise<PersonalizedContext> {
    try {
      // Get user from session
      const user = UserAuthenticationService.getUserFromSession(sessionToken);
      if (!user) {
        return {
          hasData: false,
          patientId: 'unknown',
          medicalConditions: [],
          currentMedications: [],
          allergies: [],
          recentSymptoms: [],
          contextualPrompt: 'No user session found.',
          searchEnhancers: []
        };
      }

      // Get user's health records
      const healthRecordsResult = await UserAuthenticationService.getHealthRecords(sessionToken);
      
      if (!healthRecordsResult.success || !healthRecordsResult.records) {
        return {
          hasData: false,
          patientId: user.userHash.substring(0, 16),
          medicalConditions: [],
          currentMedications: [],
          allergies: [],
          recentSymptoms: [],
          contextualPrompt: 'No medical history available for this patient.',
          searchEnhancers: []
        };
      }

      // Extract medical conditions
      const medicalConditions = this.extractMedicalConditions(healthRecordsResult.records);
      
      // Extract current medications, allergies, and symptoms
      const currentMedications = this.extractCurrentMedications(healthRecordsResult.records);
      const allergies = this.extractAllergies(healthRecordsResult.records);
      const recentSymptoms = this.extractRecentSymptoms(healthRecordsResult.records);

      // Create contextual prompt for AI
      const contextualPrompt = this.createContextualPrompt(medicalConditions, currentMedications, allergies);
      
      // Create search enhancers
      const searchEnhancers = this.createSearchEnhancers(medicalConditions);

      return {
        hasData: medicalConditions.length > 0 || currentMedications.length > 0,
        patientId: user.userHash.substring(0, 16),
        medicalConditions,
        currentMedications,
        allergies,
        recentSymptoms,
        contextualPrompt,
        searchEnhancers
      };

    } catch (error) {
      console.error('Error creating personalized context:', error);
      return {
        hasData: false,
        patientId: 'error',
        medicalConditions: [],
        currentMedications: [],
        allergies: [],
        recentSymptoms: [],
        contextualPrompt: 'Error retrieving medical context.',
        searchEnhancers: []
      };
    }
  }

  /**
   * Extract current medications from health records
   */
  private static extractCurrentMedications(records: any[]): string[] {
    const medications = new Set<string>();
    
    records.forEach(record => {
      if (record.metadata?.medications) {
        record.metadata.medications.forEach((med: string) => medications.add(med));
      }
    });

    return Array.from(medications);
  }

  /**
   * Extract allergies from health records
   */
  private static extractAllergies(records: any[]): string[] {
    const allergies = new Set<string>();
    
    records.forEach(record => {
      if (record.metadata?.allergies) {
        record.metadata.allergies.forEach((allergy: string) => allergies.add(allergy));
      }
    });

    return Array.from(allergies);
  }

  /**
   * Extract recent symptoms from health records
   */
  private static extractRecentSymptoms(records: any[]): string[] {
    const symptoms = new Set<string>();
    
    // Get records from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    records
      .filter(record => new Date(record.date) >= thirtyDaysAgo)
      .forEach(record => {
        const extractedSymptoms = this.extractSymptomsFromText(
          record.description + ' ' + (record.metadata?.notes || '')
        );
        extractedSymptoms.forEach(symptom => symptoms.add(symptom));
      });

    return Array.from(symptoms);
  }

  /**
   * Create contextual prompt for AI
   */
  private static createContextualPrompt(
    conditions: MedicalCondition[], 
    medications: string[], 
    allergies: string[]
  ): string {
    let prompt = "PATIENT MEDICAL CONTEXT FOR AI:\n\n";

    if (conditions.length > 0) {
      prompt += "KNOWN MEDICAL CONDITIONS:\n";
      conditions.forEach(condition => {
        prompt += `- ${condition.name}`;
        if (condition.severity) prompt += ` (${condition.severity})`;
        if (condition.type) prompt += ` [${condition.type}]`;
        prompt += "\n";
      });
      prompt += "\n";
    }

    if (medications.length > 0) {
      prompt += "CURRENT MEDICATIONS:\n";
      medications.forEach(med => prompt += `- ${med}\n`);
      prompt += "\n";
    }

    if (allergies.length > 0) {
      prompt += "KNOWN ALLERGIES:\n";
      allergies.forEach(allergy => prompt += `- ${allergy}\n`);
      prompt += "\n";
    }

    prompt += "IMPORTANT: When providing health advice, always consider these existing conditions and medications. Provide specific guidance relevant to this patient's medical history.";

    return prompt;
  }

  /**
   * Create search enhancers for specific conditions
   */
  private static createSearchEnhancers(conditions: MedicalCondition[]): string[] {
    const enhancers: string[] = [];
    
    conditions.forEach(condition => {
      enhancers.push(condition.name);
      
      // Add related terms
      const relatedTerms = this.getRelatedTerms(condition.name);
      enhancers.push(...relatedTerms);
    });

    return Array.from(new Set(enhancers)); // Remove duplicates
  }

  /**
   * Get related terms for a medical condition
   */
  private static getRelatedTerms(condition: string): string[] {
    const relatedTermsMap: { [key: string]: string[] } = {
      'diabetes': ['blood sugar', 'glucose', 'insulin', 'diabetic'],
      'hypertension': ['high blood pressure', 'blood pressure', 'cardiovascular'],
      'asthma': ['breathing', 'respiratory', 'airways', 'inhaler'],
      'depression': ['mental health', 'mood', 'anxiety', 'psychological'],
      'arthritis': ['joint pain', 'inflammation', 'mobility', 'joints'],
      'heart disease': ['cardiac', 'cardiovascular', 'heart', 'chest pain']
    };

    const conditionLower = condition.toLowerCase();
    for (const [key, terms] of Object.entries(relatedTermsMap)) {
      if (conditionLower.includes(key) || key.includes(conditionLower)) {
        return terms;
      }
    }

    return [];
  }

  /**
   * Enhance AI query with medical context
   */
  static enhanceQueryWithMedicalContext(
    query: string, 
    personalizedContext: PersonalizedContext
  ): AIQueryEnhancement {
    if (!personalizedContext.hasData) {
      return {
        originalQuery: query,
        enhancedQuery: query,
        relevantConditions: [],
        searchContext: '',
        personalizedPrompt: 'No medical history available for personalization.'
      };
    }

    // Find relevant conditions based on query
    const queryLower = query.toLowerCase();
    const relevantConditions = personalizedContext.medicalConditions
      .filter(condition => 
        queryLower.includes(condition.name.toLowerCase()) ||
        this.isQueryRelatedToCondition(queryLower, condition.name)
      )
      .map(condition => condition.name);

    // Add search enhancers that might be relevant
    personalizedContext.searchEnhancers.forEach(enhancer => {
      if (queryLower.includes(enhancer.toLowerCase())) {
        const relatedConditions = personalizedContext.medicalConditions
          .filter(condition => condition.name.toLowerCase().includes(enhancer.toLowerCase()))
          .map(condition => condition.name);
        relevantConditions.push(...relatedConditions);
      }
    });

    // Create enhanced query
    let enhancedQuery = query;
    let searchContext = '';

    if (relevantConditions.length > 0) {
      const conditionsText = relevantConditions.join(', ');
      enhancedQuery = `${query} in patient with ${conditionsText}`;
      searchContext = `Patient has: ${conditionsText}`;
    } else {
      // Add general medical context if no specific conditions are relevant
      const majorConditions = personalizedContext.medicalConditions
        .filter(condition => condition.type === 'chronic')
        .slice(0, 2) // Take top 2 chronic conditions
        .map(condition => condition.name);
      
      if (majorConditions.length > 0) {
        const conditionsText = majorConditions.join(', ');
        enhancedQuery = `${query} (patient has ${conditionsText})`;
        searchContext = `Patient's medical history includes: ${conditionsText}`;
      }
    }

    // Create personalized prompt
    const personalizedPrompt = this.createPersonalizedPrompt(query, personalizedContext, relevantConditions);

    return {
      originalQuery: query,
      enhancedQuery,
      relevantConditions: Array.from(new Set(relevantConditions)),
      searchContext,
      personalizedPrompt
    };
  }

  /**
   * Check if query is related to a medical condition
   */
  private static isQueryRelatedToCondition(query: string, condition: string): boolean {
    const relationMap: { [key: string]: string[] } = {
      'diabetes': ['dizzy', 'dizziness', 'thirst', 'urination', 'fatigue', 'blurred vision', 'blood sugar'],
      'hypertension': ['headache', 'dizzy', 'dizziness', 'chest pain', 'shortness of breath'],
      'asthma': ['breathing', 'cough', 'wheeze', 'chest tightness', 'shortness of breath'],
      'depression': ['sad', 'mood', 'sleep', 'appetite', 'energy', 'concentration'],
      'arthritis': ['joint pain', 'stiffness', 'swelling', 'mobility', 'movement']
    };

    const conditionLower = condition.toLowerCase();
    for (const [key, symptoms] of Object.entries(relationMap)) {
      if (conditionLower.includes(key)) {
        return symptoms.some(symptom => query.includes(symptom));
      }
    }

    return false;
  }

  /**
   * Create personalized prompt for AI
   */
  private static createPersonalizedPrompt(
    query: string, 
    context: PersonalizedContext, 
    relevantConditions: string[]
  ): string {
    let prompt = `Patient Query: "${query}"\n\n`;
    
    if (relevantConditions.length > 0) {
      prompt += `RELEVANT MEDICAL CONDITIONS: ${relevantConditions.join(', ')}\n\n`;
    }

    if (context.currentMedications.length > 0) {
      prompt += `CURRENT MEDICATIONS: ${context.currentMedications.join(', ')}\n\n`;
    }

    if (context.allergies.length > 0) {
      prompt += `ALLERGIES: ${context.allergies.join(', ')}\n\n`;
    }

    prompt += "Please provide health advice that specifically considers this patient's medical history and current conditions. ";
    prompt += "Include relevant precautions, medication interactions, and condition-specific recommendations.";

    return prompt;
  }
}

export { PersonalizedMedicalContextService };
export type { MedicalCondition, PersonalizedContext, AIQueryEnhancement };
