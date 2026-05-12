import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { supabase } from '@/lib/supabase';
import type { RecoveryCode } from '@/types/database';

// Encryption key for TOTP secrets (in production, use environment variable)
const ENCRYPTION_KEY = import.meta.env.VITE_2FA_ENCRYPTION_KEY || 'dna-ops-manual-2fa-key-change-in-production';

/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, QR codes, recovery codes, and verification
 */
export class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   */
  static generateSecret(userEmail: string, userName: string): {
    secret: string;
    uri: string;
    qrCodeUrl: Promise<string>;
  } {
    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: 'DNA Ops Manual',
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(OTPAuth.Secret.fromLatin1(Math.random().toString(36).substring(2, 15)).base32),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    // Generate QR code
    const qrCodeUrl = QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });

    return {
      secret,
      uri,
      qrCodeUrl,
    };
  }

  /**
   * Verify a TOTP code
   */
  static verifyCode(secret: string, code: string): boolean {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'DNA Ops Manual',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      // Allow 1 period before and after for time drift
      const delta = totp.validate({ token: code, window: 1 });
      return delta !== null;
    } catch (error) {
      console.error('Error verifying TOTP code:', error);
      return false;
    }
  }

  /**
   * Encrypt a TOTP secret for storage
   */
  static encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt a TOTP secret from storage
   */
  static decryptSecret(encryptedSecret: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate 10 recovery codes
   */
  static generateRecoveryCodes(): { codes: string[]; hashed: RecoveryCode[] } {
    const codes: string[] = [];
    const hashed: RecoveryCode[] = [];

    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);

      // Hash the code for storage
      const hashedCode = CryptoJS.SHA256(code).toString();
      hashed.push({
        code: hashedCode,
        used: false,
      });
    }

    return { codes, hashed };
  }

  /**
   * Verify a recovery code
   */
  static verifyRecoveryCode(code: string, recoveryCodes: RecoveryCode[]): boolean {
    const hashedInput = CryptoJS.SHA256(code.toUpperCase()).toString();
    
    const matchingCode = recoveryCodes.find(
      (rc) => rc.code === hashedInput && !rc.used
    );

    return !!matchingCode;
  }

  /**
   * Mark a recovery code as used
   */
  static async markRecoveryCodeAsUsed(userId: string, code: string): Promise<boolean> {
    try {
      // Fetch current recovery codes
      const { data: user, error: fetchError } = await supabase
        .from('user_accounts')
        .select('recovery_codes')
        .eq('id', userId)
        .single();

      if (fetchError || !user) return false;

      const recoveryCodes = user.recovery_codes as RecoveryCode[];
      if (!recoveryCodes) return false;

      // Find and mark the code as used
      const hashedInput = CryptoJS.SHA256(code.toUpperCase()).toString();
      const updatedCodes = recoveryCodes.map((rc) => {
        if (rc.code === hashedInput && !rc.used) {
          return {
            ...rc,
            used: true,
            used_at: new Date().toISOString(),
          };
        }
        return rc;
      });

      // Update in database
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({ recovery_codes: updatedCodes })
        .eq('id', userId);

      return !updateError;
    } catch (error) {
      console.error('Error marking recovery code as used:', error);
      return false;
    }
  }

  /**
   * Setup 2FA for a user
   */
  static async setupTwoFactor(
    userId: string,
    secret: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
    try {
      // Verify the code first
      if (!this.verifyCode(secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Encrypt the secret
      const encryptedSecret = this.encryptSecret(secret);

      // Generate recovery codes
      const { codes, hashed } = this.generateRecoveryCodes();

      // Update user record
      const { error } = await supabase
        .from('user_accounts')
        .update({
          two_factor_enabled: true,
          two_factor_secret: encryptedSecret,
          two_factor_configured_at: new Date().toISOString(),
          recovery_codes: hashed,
          recovery_codes_generated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, recoveryCodes: codes };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      return { success: false, error: 'Failed to setup 2FA' };
    }
  }

  /**
   * Verify 2FA during login
   */
  static async verifyTwoFactorLogin(
    userId: string,
    code: string,
    isRecoveryCode: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch user's 2FA data
      const { data: user, error: fetchError } = await supabase
        .from('user_accounts')
        .select('two_factor_secret, recovery_codes')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return { success: false, error: 'User not found' };
      }

      let verified = false;

      if (isRecoveryCode) {
        // Verify recovery code
        const recoveryCodes = user.recovery_codes as RecoveryCode[];
        verified = this.verifyRecoveryCode(code, recoveryCodes);

        if (verified) {
          // Mark recovery code as used
          await this.markRecoveryCodeAsUsed(userId, code);
        }
      } else {
        // Verify TOTP code
        const secret = this.decryptSecret(user.two_factor_secret);
        verified = this.verifyCode(secret, code);
      }

      if (!verified) {
        return { success: false, error: 'Invalid code' };
      }

      // Update last verification timestamp
      await supabase
        .from('user_accounts')
        .update({ last_two_factor_verification: new Date().toISOString() })
        .eq('id', userId);

      return { success: true };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Disable 2FA for a user (Client Users only)
   */
  static async disableTwoFactor(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          recovery_codes: null,
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Regenerate recovery codes
   */
  static async regenerateRecoveryCodes(
    userId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
    try {
      // Fetch user's secret to verify the code
      const { data: user, error: fetchError } = await supabase
        .from('user_accounts')
        .select('two_factor_secret')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Verify the code
      const secret = this.decryptSecret(user.two_factor_secret);
      if (!this.verifyCode(secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Generate new recovery codes
      const { codes, hashed } = this.generateRecoveryCodes();

      // Update user record
      const { error } = await supabase
        .from('user_accounts')
        .update({
          recovery_codes: hashed,
          recovery_codes_generated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, recoveryCodes: codes };
    } catch (error) {
      console.error('Error regenerating recovery codes:', error);
      return { success: false, error: 'Failed to regenerate recovery codes' };
    }
  }
}
