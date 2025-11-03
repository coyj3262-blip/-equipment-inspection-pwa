/**
 * Geolocation Service
 *
 * Handles GPS location requests, permission management, and distance calculations
 * using the Haversine formula for accurate lat/lng distance computation.
 *
 * ALL DISTANCES ARE IN FEET (Imperial units only)
 */

import type { Coordinates, LocationResult, ValidationResult } from "../types/timeTracking";

/**
 * Ensure accuracy value is a finite number before persisting.
 * Some browsers (notably Mobile Safari) may return undefined.
 * Browser returns meters, we convert to feet.
 */
function sanitizeAccuracy(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Convert meters to feet
    return value * 3.28084;
  }
  return 32800; // Treat as extremely poor accuracy (10km in feet) so entry is flagged
}

/**
 * Request current GPS location with timeout and fallback strategies
 *
 * Strategy:
 * 1. Try high accuracy with 10s timeout
 * 2. If fails, retry with lower accuracy
 * 3. Handle permission denial gracefully
 *
 * Returns accuracy in FEET (converted from browser's meters)
 */
export async function getCurrentLocation(timeout = 10000): Promise<LocationResult> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      coords: { lat: 0, lng: 0 },
      accuracy: 0,
      timestamp: Date.now(),
      denied: true,
      error: "Geolocation not supported by this browser",
    };
  }

  // Check permission state (if supported)
  try {
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (permission.state === "denied") {
        return {
          coords: { lat: 0, lng: 0 },
          accuracy: 0,
          timestamp: Date.now(),
          denied: true,
          error: "Location permission denied",
        };
      }
    }
  } catch (err) {
    // Permission API not supported, continue with getCurrentPosition
    console.warn("Permission API not supported:", err);
  }

  // Try getting high-accuracy location first
  try {
    const position = await getPositionWithTimeout(
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 0, // Don't use cached position
      },
      timeout
    );

    return {
      coords: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      accuracy: sanitizeAccuracy(position.coords.accuracy),
      timestamp: position.timestamp,
    };
  } catch (highAccuracyError) {
    console.warn("High accuracy location failed, trying lower accuracy:", highAccuracyError);

    // Fallback: try lower accuracy
    try {
      const position = await getPositionWithTimeout(
        {
          enableHighAccuracy: false,
          timeout: timeout / 2,
          maximumAge: 30000, // Accept 30s old position
        },
        timeout / 2
      );

      return {
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        accuracy: sanitizeAccuracy(position.coords.accuracy),
        timestamp: position.timestamp,
      };
    } catch (lowAccuracyError) {
      // Both attempts failed
      const error = lowAccuracyError as GeolocationPositionError;
      const denied = error.code === 1; // PERMISSION_DENIED

      return {
        coords: { lat: 0, lng: 0 },
        accuracy: 0,
        timestamp: Date.now(),
        denied,
        error: getErrorMessage(error),
      };
    }
  }
}

/**
 * Wrapper to promisify getCurrentPosition with timeout
 */
function getPositionWithTimeout(
  options: PositionOptions,
  timeout: number
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Location request timed out after ${timeout}ms`));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve(position);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      options
    );
  });
}

/**
 * Get human-readable error message from GeolocationPositionError
 */
function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return "Location permission denied";
    case 2: // POSITION_UNAVAILABLE
      return "Location information unavailable";
    case 3: // TIMEOUT
      return "Location request timed out";
    default:
      return error.message || "Unknown location error";
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * Returns distance in FEET
 *
 * Formula:
 * a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 *
 * where φ = latitude, λ = longitude, R = Earth radius
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 20902230.97; // Earth radius in feet (6371km * 3280.84 ft/km)
  const φ1 = toRadians(coord1.lat);
  const φ2 = toRadians(coord2.lat);
  const Δφ = toRadians(coord2.lat - coord1.lat);
  const Δλ = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in feet
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validate if user's location is within the job site radius
 *
 * Takes GPS accuracy into account by adding it to the effective radius
 * This prevents false negatives when GPS accuracy is poor.
 *
 * ALL VALUES IN FEET
 *
 * Example:
 * - Site radius: 328ft (100m)
 * - GPS accuracy: 82ft (25m)
 * - Effective radius: 410ft
 * - User distance: 360ft → VALID (within effective radius)
 */
export function isWithinRadius(
  userCoords: Coordinates,
  userAccuracy: number,
  siteCoords: Coordinates,
  radiusFeet: number
): ValidationResult {
  const distance = calculateDistance(userCoords, siteCoords);
  const effectiveRadius = radiusFeet + userAccuracy;
  const valid = distance <= effectiveRadius;

  let reason: string | undefined;
  if (!valid) {
    const overage = Math.round(distance - radiusFeet);
    reason = `${Math.round(distance)}ft from site (${overage}ft outside ${radiusFeet}ft radius)`;
  }

  return {
    valid,
    distance,
    effectiveRadius,
    reason,
  };
}

/**
 * Check if GPS accuracy is acceptable
 *
 * Poor accuracy (>328ft/100m) should be flagged for supervisor review
 */
export function isAccuracyAcceptable(accuracy: number): boolean {
  return accuracy <= 328; // 328ft (100m) threshold
}

/**
 * Format distance for display in imperial units (feet/miles)
 */
export function formatDistance(feet: number): string {
  // Use feet for distances under 1000 feet
  if (feet < 1000) {
    return `${Math.round(feet)}ft`;
  }

  // Use miles for longer distances
  const miles = feet / 5280;
  if (miles < 10) {
    return `${miles.toFixed(2)} mi`;
  }
  return `${miles.toFixed(1)} mi`;
}

/**
 * Format radius for display (typically smaller distances)
 */
export function formatRadius(feet: number): string {
  if (feet < 528) { // Less than 0.1 mile
    return `${Math.round(feet)}ft`;
  }
  const miles = feet / 5280;
  return `${miles.toFixed(2)} mi`;
}

/**
 * Get user-friendly permission prompt message
 */
export function getPermissionPromptMessage(): string {
  return "This app needs your location to verify you're at the job site when clocking in. Your location is only captured during clock-in/out and is not tracked continuously.";
}
