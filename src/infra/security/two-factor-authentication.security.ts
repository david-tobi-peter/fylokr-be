import { TOTP } from "otplib";
import base32Encode from "base32-encode";
import crypto from "crypto";
import config from "#/config";
import { Service } from "typedi";

@Service()
export class AuthenticatorService {
  private masterKey = config.authenticator.secret;
  private totp: TOTP;

  constructor() {
    this.totp = new TOTP({
      period: 30,
      digits: 6,
      epoch: 30,
      algorithm: "sha1",
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

    return this.totp.toURI({
      secret,
      issuer,
      label: options.username,
    });
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.username
   * @param {string} options.code
   * @returns {Promise<boolean>}
   */
  async isCodeVerified(options: {
    id: string;
    username: string;
    code: string;
  }): Promise<boolean> {
    const normalizedCode = options.code.replace(/\s+/g, "");
    const secret = this.generateSecret(options);

    const verifiedCode = await this.totp.verify(normalizedCode, { secret });

    return verifiedCode.valid;
  }
}
