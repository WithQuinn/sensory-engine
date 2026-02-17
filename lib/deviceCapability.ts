/**
 * Device Capability Detection
 * Detects iOS version and hardware capabilities to route to appropriate synthesis engine
 */

export type DeviceCapability = "apple_intelligence" | "phi3_local" | "queue_synthesis";

/**
 * Detect device capability from user agent string
 *
 * Routing logic:
 * - iOS 18.1+ with Apple Intelligence → "apple_intelligence"
 * - iOS 15-18.0 with A15+ chip → "phi3_local"
 * - iOS <15 or A14 chip → "queue_synthesis"
 * - Unknown → "queue_synthesis" (safe default)
 */
export function detectDeviceCapability(userAgent: string): DeviceCapability {
  // Extract iOS version and device info
  const iosVersion = extractIOSVersion(userAgent);
  const deviceChip = detectChip(userAgent);

  // iOS 18.1+ with Apple Intelligence available
  if (iosVersion && iosVersion.major >= 18 && iosVersion.minor >= 1) {
    // Apple Intelligence available on iOS 18.1+
    if (deviceChip && isA15OrNewer(deviceChip)) {
      return "apple_intelligence";
    }
  }

  // iOS 15-18.0 with A15+ chip (can run Phi-3 locally)
  if (
    iosVersion &&
    iosVersion.major >= 15 &&
    !(iosVersion.major > 18 || (iosVersion.major === 18 && iosVersion.minor >= 1))
  ) {
    if (deviceChip && isA15OrNewer(deviceChip)) {
      return "phi3_local";
    }
  }

  // Fallback: iOS <15 or older chip, queue synthesis for later
  return "queue_synthesis";
}

/**
 * Parse iOS version from user agent string
 * Examples:
 * - "iPhone OS 18_1" → { major: 18, minor: 1 }
 * - "iPhone OS 15_7" → { major: 15, minor: 7 }
 */
function extractIOSVersion(userAgent: string): {
  major: number;
  minor: number;
} | null {
  // Match patterns like "OS 18_1", "OS 15_7", etc.
  const iosMatch = userAgent.match(/OS\s(\d+)[_\s](\d+)/);
  if (!iosMatch) {
    return null;
  }

  return {
    major: parseInt(iosMatch[1], 10),
    minor: parseInt(iosMatch[2], 10),
  };
}

/**
 * Detect chip from user agent (A14, A15, A16, etc.)
 * Examples:
 * - "iPhone13,1" (iPhone 13 mini) → A15
 * - "iPhone12,1" (iPhone 12) → A14
 * - "iPhone14,2" (iPhone 14 Pro) → A16
 */
function detectChip(userAgent: string): string | null {
  // Extract device model identifier
  const deviceMatch = userAgent.match(/iPhone(\d+),(\d+)/);
  if (!deviceMatch) {
    return null;
  }

  const modelNumber = parseInt(deviceMatch[1], 10);

  // Map iPhone model numbers to chips
  // See: https://en.wikipedia.org/wiki/List_of_iOS_and_iPadOS_devices
  const chipMap: { [key: number]: string } = {
    // iPhone 15 series (A17 Pro)
    16: "A17_Pro",
    // iPhone 14 series (A15/A16)
    15: "A16",
    14: "A15", // iPhone 14
    // iPhone 13 series (A15)
    13: "A15",
    12: "A15", // iPhone 13 mini
    // iPhone 12 series (A14/A15)
    11: "A14",
    // Older models (pre-A15)
    10: "A13",
    9: "A13",
  };

  return chipMap[modelNumber] || null;
}

/**
 * Check if chip is A15 or newer (requirement for Phi-3 inference)
 */
function isA15OrNewer(chip: string): boolean {
  const a15OrNewerChips = [
    "A15",
    "A15_Bionic",
    "A16",
    "A16_Bionic",
    "A17",
    "A17_Pro",
    "A18",
    "A18_Pro",
    "M1",
    "M2",
    "M3",
  ];
  return a15OrNewerChips.some((c) => chip.includes(c));
}

/**
 * Get device capability info for debugging
 */
export function getDeviceInfo(userAgent: string): {
  capability: DeviceCapability;
  iosVersion: { major: number; minor: number } | null;
  chip: string | null;
  supportsAppleIntelligence: boolean;
  supportsPhi3: boolean;
} {
  const iosVersion = extractIOSVersion(userAgent);
  const chip = detectChip(userAgent);
  const capability = detectDeviceCapability(userAgent);

  return {
    capability,
    iosVersion,
    chip,
    supportsAppleIntelligence: capability === "apple_intelligence",
    supportsPhi3:
      capability === "apple_intelligence" || capability === "phi3_local",
  };
}
