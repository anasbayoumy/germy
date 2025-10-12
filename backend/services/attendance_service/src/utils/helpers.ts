import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import moment from 'moment';

// Generate unique IDs
export const generateId = (): string => uuidv4();

// Generate secure random strings
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate device fingerprint
export const generateDeviceFingerprint = (userAgent: string, additionalData?: any): string => {
  const data = {
    userAgent,
    ...additionalData,
  };
  return hashData(JSON.stringify(data));
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check if location is within geofence
export const isWithinGeofence = (
  userLat: number,
  userLon: number,
  geofenceLat: number,
  geofenceLon: number,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, geofenceLat, geofenceLon);
  return distance <= radiusMeters;
};

// Calculate work hours
export const calculateWorkHours = (
  clockIn: Date,
  clockOut: Date,
  breakTimeMinutes: number = 0
): number => {
  const totalMinutes = moment(clockOut).diff(moment(clockIn), 'minutes');
  const workMinutes = totalMinutes - breakTimeMinutes;
  return Math.max(0, workMinutes / 60); // Return hours
};

// Calculate productivity score
export const calculateProductivityScore = (
  productiveTime: number,
  totalTime: number,
  breakTime: number = 0
): number => {
  if (totalTime <= 0) return 0;
  
  const adjustedTotalTime = totalTime - breakTime;
  if (adjustedTotalTime <= 0) return 0;
  
  const score = (productiveTime / adjustedTotalTime) * 100;
  return Math.min(100, Math.max(0, score));
};

// Format time duration
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Sanitize input data
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
};

// Generate risk level from score
export const getRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 85) return 'HIGH';
  return 'CRITICAL';
};

// Calculate risk score from multiple factors
export const calculateRiskScore = (factors: {
  faceSimilarity?: number;
  livenessScore?: number;
  locationAccuracy?: number;
  deviceConsistency?: number;
  activityScore?: number;
  timePattern?: number;
}): number => {
  const weights = {
    faceSimilarity: 0.25,
    livenessScore: 0.20,
    locationAccuracy: 0.20,
    deviceConsistency: 0.15,
    activityScore: 0.15,
    timePattern: 0.05,
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(factors).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const weight = weights[key as keyof typeof weights] || 0;
      totalScore += value * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

// Generate timestamp
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Parse date safely
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Validate image file
export const validateImageFile = (file: Express.Multer.File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
};

// Generate file path
export const generateFilePath = (userId: string, type: 'photo' | 'verification'): string => {
  const timestamp = Date.now();
  const randomId = generateSecureToken(8);
  return `${type}/${userId}/${timestamp}_${randomId}`;
};

// Calculate time difference in minutes
export const getTimeDifferenceInMinutes = (start: Date, end: Date): number => {
  return Math.abs(end.getTime() - start.getTime()) / (1000 * 60);
};

// Check if time is within business hours
export const isWithinBusinessHours = (
  date: Date,
  startHour: number = 9,
  endHour: number = 17
): boolean => {
  const hour = date.getHours();
  return hour >= startHour && hour < endHour;
};

// Generate activity summary
export const generateActivitySummary = (activities: any[]): {
  totalTime: number;
  productiveTime: number;
  breakTime: number;
  distractionTime: number;
  productivityScore: number;
} => {
  const totalTime = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
  const productiveTime = activities
    .filter(activity => activity.type === 'productive')
    .reduce((sum, activity) => sum + (activity.duration || 0), 0);
  const breakTime = activities
    .filter(activity => activity.type === 'break')
    .reduce((sum, activity) => sum + (activity.duration || 0), 0);
  const distractionTime = activities
    .filter(activity => activity.type === 'distraction')
    .reduce((sum, activity) => sum + (activity.duration || 0), 0);

  const productivityScore = calculateProductivityScore(productiveTime, totalTime, breakTime);

  return {
    totalTime,
    productiveTime,
    breakTime,
    distractionTime,
    productivityScore,
  };
};
