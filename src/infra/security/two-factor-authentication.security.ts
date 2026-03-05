import { OTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import base32Encode from "base32-encode";
import crypto from "crypto";
import bcrypt from "bcrypt";
import config from "#/config";
import { Service } from "typedi";
import { Logger } from "../logger/index.js";

@Service()
export class TwoFactorAuthenticationSecurity {
  private masterKey = config.authenticator.secret;
  private otp: OTP;

  constructor() {
    this.otp = new OTP({
      strategy: "totp",
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.username
   * @returns {string}
   */
  generateSecret(options: { id: string; username: string }): string {
    const hmac = crypto.createHmac("sha256", this.masterKey);
    hmac.update(`${config.app.environment}:${options.id}:${options.username}`);
    const digest = hmac.digest();

    return base32Encode(digest, "RFC4648", { padding: false });
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.username
   * @returns {string}
   */
  generateQRUri(options: { id: string; username: string }): string {
    const secret = this.generateSecret(options);
    const issuer = `Fylokr:${config.app.environment}`;

    return this.otp.generateURI({
      issuer,
      label: options.username,
      secret,
      period: 30,
      digits: 6,
      algorithm: "sha1",
    });
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.username
   * @param {string} options.code
   * @param {string[]} options.hashedRecoveryCodes
   * @returns {Promise<boolean>}
   */
  async isValidTwoFACode(options: {
    id: string;
    username: string;
    code: string;
    hashedRecoveryCodes: string[] | null;
  }): Promise<boolean> {
    const normalizedCode = options.code.trim().replace(/\s+/g, "");
    const isAlphanumeric = !/^\d+$/.test(normalizedCode);

    if (!isAlphanumeric) {
      const secret = this.generateSecret({
        id: options.id,
        username: options.username,
      });

      try {
        const result = await this.otp.verify({
          token: normalizedCode,
          secret,
          period: 30,
          digits: 6,
          algorithm: "sha1",
        });

        if (result.valid) {
          return true;
        }
      } catch (error) {
        Logger.error("Failed to verify 2FA code", error);
        return false;
      }
    }

    if (
      !options.hashedRecoveryCodes ||
      options.hashedRecoveryCodes.length === 0
    ) {
      return false;
    }

    const comparisons = options.hashedRecoveryCodes.map((hash) =>
      bcrypt.compare(normalizedCode, hash.toString()),
    );

    const results = await Promise.all(comparisons);
    return results.some((match) => match === true);
  }
}
