import { createHash } from "crypto";
import { UAParser } from "ua-parser-js";

export interface DeviceInfo {
  browserName: string;
  deviceType: string;
  deviceCPU: string;
  deviceModel: string;
}

class DeviceFingerprint {
  /**
   * @param {string} userAgent
   * @returns {DeviceInfo}
   */
  private generate(userAgent: string): DeviceInfo {
    const { browser, cpu, device } = UAParser(userAgent);

    return {
      browserName: browser.name || "Unknown",
      deviceType: device.type || "Unknown",
      deviceCPU: cpu.architecture || "Unknown",
      deviceModel: device.model || "Unknown",
    };
  }

  /**
   * @param {string} userAgent
   * @returns {string}
   */
  public generateHash(userAgent: string): string {
    const deviceInfo = this.generate(userAgent);
    const fingerprint = `${deviceInfo.deviceType}:${deviceInfo.deviceCPU}:${deviceInfo.deviceModel}`;

    return createHash("sha256")
      .update(fingerprint)
      .digest("hex")
      .substring(0, 16);
  }
}

export const fingerprintSecurity = new DeviceFingerprint();
