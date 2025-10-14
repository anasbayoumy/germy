import { logger } from '../utils/logger';
import crypto from 'crypto';

// Fraud Detection Configuration
const FRAUD_CONFIG = {
  riskThresholds: {
    low: 40,
    medium: 60,
    high: 80
  },
  processingTimeMs: 200,
  modelVersion: 'fraud_detection_v1.0_mock',
  maxBatchSize: 10,
  timeoutMs: 30000
};

export interface FraudDetectionResult {
  success: boolean;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  isFraudulent?: boolean;
  processingTime?: number;
  metadata?: {
    modelVersion: string;
    detectionResults: {
      locationAnomaly: boolean;
      timeAnomaly: boolean;
      deviceAnomaly: boolean;
      behavioralAnomaly: boolean;
      patternAnomaly: boolean;
    };
    confidence: number;
    flags: string[];
    evidence: any;
  };
  error?: string;
}

export interface FraudAnalysisData {
  userId: string;
  companyId: string;
  attendanceId?: string;
  clockInTime: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
  workMode: 'onsite' | 'remote' | 'hybrid';
  expectedLocation?: string;
  faceSimilarity?: number;
  previousLocations?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  previousDevices?: string[];
  attendanceHistory?: Array<{
    clockInTime: string;
    location?: any;
    deviceInfo?: string;
  }>;
}

export class FraudDetectionService {
  private modelLoaded = false;
  private modelVersion = FRAUD_CONFIG.modelVersion;

  constructor() {
    this.initializeModel();
  }

  /**
   * Initialize the mock fraud detection model
   */
  private async initializeModel(): Promise<void> {
    try {
      logger.info('Initializing Fraud Detection model...', { service: 'ai-service' });
      
      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.modelLoaded = true;
      logger.info('Fraud Detection model initialized successfully', { 
        service: 'ai-service',
        modelVersion: this.modelVersion,
        riskThresholds: FRAUD_CONFIG.riskThresholds
      });
    } catch (error) {
      logger.error('Failed to initialize Fraud Detection model:', error);
      throw error;
    }
  }

  /**
   * Analyze attendance data for fraud patterns
   */
  async analyzeFraud(
    data: FraudAnalysisData,
    metadata?: any
  ): Promise<FraudDetectionResult> {
    const startTime = Date.now();
    
    try {
      if (!this.modelLoaded) {
        throw new Error('Fraud Detection model not loaded');
      }

      logger.info('Processing fraud detection request', {
        service: 'ai-service',
        userId: data.userId,
        companyId: data.companyId,
        attendanceId: data.attendanceId,
        workMode: data.workMode,
        metadata
      });

      // Perform various fraud detection checks
      const detectionResults = await this.performFraudChecks(data);
      
      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(detectionResults, data);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Determine if fraudulent
      const isFraudulent = riskScore >= FRAUD_CONFIG.riskThresholds.high;
      
      // Generate evidence and flags
      const evidence = this.generateEvidence(detectionResults, data);
      const flags = this.generateFlags(detectionResults, riskScore);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Fraud detection completed', {
        service: 'ai-service',
        userId: data.userId,
        riskScore,
        riskLevel,
        isFraudulent,
        processingTime
      });

      return {
        success: true,
        riskScore,
        riskLevel,
        isFraudulent,
        processingTime,
        metadata: {
          modelVersion: this.modelVersion,
          detectionResults,
          confidence: this.calculateConfidence(detectionResults),
          flags,
          evidence
        }
      };

    } catch (error) {
      logger.error('Fraud detection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Perform various fraud detection checks
   */
  private async performFraudChecks(data: FraudAnalysisData): Promise<any> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const checks = {
      locationAnomaly: this.checkLocationAnomaly(data),
      timeAnomaly: this.checkTimeAnomaly(data),
      deviceAnomaly: this.checkDeviceAnomaly(data),
      behavioralAnomaly: this.checkBehavioralAnomaly(data),
      patternAnomaly: this.checkPatternAnomaly(data)
    };

    return checks;
  }

  /**
   * Check for location-based anomalies
   */
  private checkLocationAnomaly(data: FraudAnalysisData): boolean {
    if (!data.location || data.workMode === 'remote') {
      return false;
    }

    // Simulate location anomaly detection
    // In real implementation, this would check against:
    // - Expected office location
    // - Previous attendance locations
    // - Geofence violations
    // - GPS spoofing indicators

    const locationHash = crypto.createHash('md5')
      .update(`${data.userId}-${data.location.latitude}-${data.location.longitude}`)
      .digest('hex');
    
    const anomalyScore = parseInt(locationHash.substring(0, 2), 16);
    return anomalyScore > 200; // 20% chance of location anomaly
  }

  /**
   * Check for time-based anomalies
   */
  private checkTimeAnomaly(data: FraudAnalysisData): boolean {
    const clockInTime = new Date(data.clockInTime);
    const hour = clockInTime.getHours();
    
    // Check for unusual clock-in times
    // Outside normal business hours (6 AM - 10 PM)
    if (hour < 6 || hour > 22) {
      return true;
    }

    // Check for weekend attendance (if not expected)
    const dayOfWeek = clockInTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 30% chance of weekend anomaly
      return Math.random() < 0.3;
    }

    return false;
  }

  /**
   * Check for device-based anomalies
   */
  private checkDeviceAnomaly(data: FraudAnalysisData): boolean {
    if (!data.deviceInfo || !data.previousDevices) {
      return false;
    }

    // Check if device has been used before
    const isNewDevice = !data.previousDevices.includes(data.deviceInfo);
    
    if (isNewDevice) {
      // 40% chance of device anomaly for new devices
      return Math.random() < 0.4;
    }

    return false;
  }

  /**
   * Check for behavioral anomalies
   */
  private checkBehavioralAnomaly(data: FraudAnalysisData): boolean {
    // Simulate behavioral pattern analysis
    // In real implementation, this would analyze:
    // - Clock-in patterns
    // - Location patterns
    // - Device usage patterns
    // - Face recognition confidence

    const behaviorHash = crypto.createHash('md5')
      .update(`${data.userId}-${data.clockInTime}`)
      .digest('hex');
    
    const behaviorScore = parseInt(behaviorHash.substring(0, 2), 16);
    return behaviorScore > 180; // 15% chance of behavioral anomaly
  }

  /**
   * Check for pattern-based anomalies
   */
  private checkPatternAnomaly(data: FraudAnalysisData): boolean {
    if (!data.attendanceHistory || data.attendanceHistory.length < 5) {
      return false;
    }

    // Simulate pattern analysis
    // In real implementation, this would analyze:
    // - Attendance frequency patterns
    // - Location consistency
    // - Time consistency
    // - Device consistency

    const patternHash = crypto.createHash('md5')
      .update(`${data.userId}-${data.attendanceHistory.length}`)
      .digest('hex');
    
    const patternScore = parseInt(patternHash.substring(0, 2), 16);
    return patternScore > 220; // 10% chance of pattern anomaly
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(detectionResults: any, data: FraudAnalysisData): number {
    let riskScore = 0;

    // Base risk factors
    if (detectionResults.locationAnomaly) riskScore += 25;
    if (detectionResults.timeAnomaly) riskScore += 20;
    if (detectionResults.deviceAnomaly) riskScore += 15;
    if (detectionResults.behavioralAnomaly) riskScore += 20;
    if (detectionResults.patternAnomaly) riskScore += 20;

    // Additional risk factors
    if (data.faceSimilarity && data.faceSimilarity < 0.7) {
      riskScore += 30; // Low face similarity is high risk
    }

    if (data.workMode === 'remote' && !data.location) {
      riskScore += 10; // Remote work without location
    }

    // Add some randomness to make it more realistic
    riskScore += (Math.random() - 0.5) * 10;
    
    return Math.min(Math.max(riskScore, 0), 100);
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 90) return 'critical';
    if (riskScore >= FRAUD_CONFIG.riskThresholds.high) return 'high';
    if (riskScore >= FRAUD_CONFIG.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate evidence for fraud detection
   */
  private generateEvidence(detectionResults: any, data: FraudAnalysisData): any {
    const evidence: any = {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      companyId: data.companyId,
      attendanceId: data.attendanceId
    };

    if (detectionResults.locationAnomaly) {
      evidence.locationAnomaly = {
        detected: true,
        location: data.location,
        expectedLocation: data.expectedLocation,
        workMode: data.workMode
      };
    }

    if (detectionResults.timeAnomaly) {
      evidence.timeAnomaly = {
        detected: true,
        clockInTime: data.clockInTime,
        hour: new Date(data.clockInTime).getHours(),
        dayOfWeek: new Date(data.clockInTime).getDay()
      };
    }

    if (detectionResults.deviceAnomaly) {
      evidence.deviceAnomaly = {
        detected: true,
        currentDevice: data.deviceInfo,
        previousDevices: data.previousDevices
      };
    }

    if (detectionResults.behavioralAnomaly) {
      evidence.behavioralAnomaly = {
        detected: true,
        pattern: 'unusual_behavior_detected'
      };
    }

    if (detectionResults.patternAnomaly) {
      evidence.patternAnomaly = {
        detected: true,
        historyLength: data.attendanceHistory?.length || 0
      };
    }

    return evidence;
  }

  /**
   * Generate fraud flags
   */
  private generateFlags(detectionResults: any, riskScore: number): string[] {
    const flags: string[] = [];

    if (detectionResults.locationAnomaly) flags.push('LOCATION_ANOMALY');
    if (detectionResults.timeAnomaly) flags.push('TIME_ANOMALY');
    if (detectionResults.deviceAnomaly) flags.push('DEVICE_ANOMALY');
    if (detectionResults.behavioralAnomaly) flags.push('BEHAVIORAL_ANOMALY');
    if (detectionResults.patternAnomaly) flags.push('PATTERN_ANOMALY');
    
    if (riskScore >= 90) flags.push('CRITICAL_RISK');
    if (riskScore >= 80) flags.push('HIGH_RISK');
    if (riskScore >= 60) flags.push('MEDIUM_RISK');

    return flags;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(detectionResults: any): number {
    const checks = Object.values(detectionResults);
    const positiveChecks = checks.filter((check: any) => check === true).length;
    const totalChecks = checks.length;
    
    // Higher confidence when more checks are positive
    return Math.min(0.5 + (positiveChecks / totalChecks) * 0.5, 1.0);
  }

  /**
   * Get model information
   */
  getModelInfo(): any {
    return {
      modelVersion: this.modelVersion,
      riskThresholds: FRAUD_CONFIG.riskThresholds,
      maxBatchSize: FRAUD_CONFIG.maxBatchSize,
      timeoutMs: FRAUD_CONFIG.timeoutMs,
      loaded: this.modelLoaded
    };
  }
}
