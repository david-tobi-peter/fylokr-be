import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";

export interface ClientHeuristic {
  browser: string;
  browserMajor: string;
  os: string;
  osVersion: string;
  cpuArch: string;
}

class ClientHeuristicFingerprint {
  /**
   * @param {string} userAgent
   * @returns {ClientHeuristic}
   */
  private extract(userAgent: string): ClientHeuristic {
    const parser = new UAParser(userAgent);
    const { browser, os, cpu } = parser.getResult();

    return {
      browser: browser.name ?? "unknown",
      browserMajor: browser.major ?? "unknown",
      os: os.name ?? "unknown",
      osVersion: os.version ?? "unknown",
      cpuArch: cpu.architecture ?? "unknown",
    };
  }

  /**
   * @param {string} userAgent
   * @returns {string}
   */
  public generateHash(userAgent: string): string {
    const heuristic = this.extract(userAgent);

    const material = [
      heuristic.browser,
      heuristic.browserMajor,
      heuristic.os,
      heuristic.osVersion,
      heuristic.cpuArch,
    ].join("|");

    return createHash("sha256").update(material).digest("hex").slice(0, 16);
  }
}

export const clientHeuristicFingerprint = new ClientHeuristicFingerprint();
