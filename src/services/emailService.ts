// ============================================
// Email Service
// Sends emails using SMTP settings from database
// ============================================

import { supabase } from '@/lib/supabase';
import type { SMTPSettings } from '@/types/database';

/**
 * Fetch active SMTP settings from database
 */
export async function getSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[EmailService] Error fetching SMTP settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[EmailService] Error:', err);
    return null;
  }
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(
  email: string,
  fullName: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpSettings = await getSMTPSettings();

    if (!smtpSettings) {
      console.error('[EmailService] No active SMTP settings found');
      return {
        success: false,
        error: 'SMTP not configured. Please contact your administrator to set up email settings.',
      };
    }

    // Construct verification URL
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/#/verify-email?token=${verificationToken}`;

    // Email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - DNA Ops Manual</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: #f3350c; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 32px; font-weight: bold;">D</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">DNA Ops Manual</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1a1a1a;">Welcome, ${fullName}!</h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Your account has been created for DNA Ops Manual. To get started, please verify your email address by clicking the button below:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #f3350c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; word-break: break-all; color: #f3350c;">
                ${verificationUrl}
              </p>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                <strong>Note:</strong> This verification link will expire in 24 hours for security reasons.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="margin: 0; font-size: 13px; color: #8a8a8a;">
                If you didn't request this account, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #8a8a8a; text-align: center;">
                © ${new Date().getFullYear()} DNA Advisory. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailText = `
Welcome to DNA Ops Manual!

Hello ${fullName},

Your account has been created. To get started, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't request this account, please ignore this email or contact support if you have concerns.

© ${new Date().getFullYear()} DNA Advisory. All rights reserved.
    `;

    // Call Netlify Function to send email
    console.log('[EmailService] Sending verification email to:', email);
    console.log('[EmailService] Verification URL:', verificationUrl);

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          from: `${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}>`,
          subject: 'Verify Your Email - DNA Ops Manual',
          html: emailHtml,
          text: emailText,
          smtpConfig: {
            host: smtpSettings.smtp_host,
            port: smtpSettings.smtp_port,
            secure: smtpSettings.smtp_use_tls,
            auth: {
              user: smtpSettings.smtp_username,
              pass: smtpSettings.smtp_password,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EmailService] Email sending failed:', errorData);
        return {
          success: false,
          error: errorData.details || 'Failed to send email',
        };
      }

      const result = await response.json();
      console.log('[EmailService] Email sent successfully:', result.messageId);

      return { success: true };
    } catch (err) {
      console.error('[EmailService] Network error sending email:', err);
      // Log verification URL for debugging
      console.log('[EmailService] Verification link (for manual testing):', verificationUrl);
      return {
        success: false,
        error: 'Network error sending email. Please check SMTP configuration.',
      };
    }
  } catch (err) {
    console.error('[EmailService] Error sending verification email:', err);
    return {
      success: false,
      error: (err as Error).message || 'Failed to send verification email',
    };
  }
}

/**
 * Send welcome email after user verifies and sets password
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpSettings = await getSMTPSettings();

    if (!smtpSettings) {
      return { success: false, error: 'SMTP not configured' };
    }

    // Welcome email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to DNA Ops Manual</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #1a1a1a; margin: 0 0 20px;">Welcome to DNA Ops Manual!</h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Your account is now fully set up and ready to use. You can now log in and start using DNA Ops Manual.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/#/login" style="display: inline-block; padding: 14px 32px; background-color: #f3350c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Go to Login
                </a>
              </div>
              <p style="color: #8a8a8a; font-size: 13px; margin-top: 30px;">
                © ${new Date().getFullYear()} DNA Advisory. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log('[EmailService] Sending welcome email to:', email);

    const emailText = `
Welcome to DNA Ops Manual!

Hello ${fullName},

Your account is now fully set up and ready to use. You can now log in and start using DNA Ops Manual.

Login at: ${window.location.origin}/#/login

© ${new Date().getFullYear()} DNA Advisory. All rights reserved.
    `;

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          from: `${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}>`,
          subject: 'Welcome to DNA Ops Manual',
          html: emailHtml,
          text: emailText,
          smtpConfig: {
            host: smtpSettings.smtp_host,
            port: smtpSettings.smtp_port,
            secure: smtpSettings.smtp_use_tls,
            auth: {
              user: smtpSettings.smtp_username,
              pass: smtpSettings.smtp_password,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EmailService] Welcome email sending failed:', errorData);
        return {
          success: false,
          error: errorData.details || 'Failed to send welcome email',
        };
      }

      const result = await response.json();
      console.log('[EmailService] Welcome email sent successfully:', result.messageId);

      return { success: true };
    } catch (err) {
      console.error('[EmailService] Network error sending welcome email:', err);
      return {
        success: false,
        error: 'Network error sending email.',
      };
    }
  } catch (err) {
    console.error('[EmailService] Error sending welcome email:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Test SMTP configuration
 */
export async function testSMTPSettings(smtpSettings: SMTPSettings): Promise<{ success: boolean; error?: string }> {
  try {
    // Send test email to the from address
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SMTP Test Email</title>
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>SMTP Configuration Test</h2>
  <p>This is a test email to verify your SMTP settings are working correctly.</p>
  <p><strong>Configuration:</strong></p>
  <ul>
    <li>Host: ${smtpSettings.smtp_host}</li>
    <li>Port: ${smtpSettings.smtp_port}</li>
    <li>TLS: ${smtpSettings.smtp_use_tls ? 'Enabled' : 'Disabled'}</li>
    <li>From: ${smtpSettings.smtp_from_email}</li>
  </ul>
  <p>If you received this email, your SMTP configuration is working!</p>
</body>
</html>
    `;

    console.log('[EmailService] Testing SMTP settings...');
    console.log('Sending test email to:', smtpSettings.smtp_from_email);

    const emailText = `
SMTP Configuration Test

This is a test email to verify your SMTP settings are working correctly.

Configuration:
- Host: ${smtpSettings.smtp_host}
- Port: ${smtpSettings.smtp_port}
- TLS: ${smtpSettings.smtp_use_tls ? 'Enabled' : 'Disabled'}
- From: ${smtpSettings.smtp_from_email}

If you received this email, your SMTP configuration is working!
    `;

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smtpSettings.smtp_from_email,
          from: `${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}>`,
          subject: 'SMTP Configuration Test - DNA Ops Manual',
          html: emailHtml,
          text: emailText,
          smtpConfig: {
            host: smtpSettings.smtp_host,
            port: smtpSettings.smtp_port,
            secure: smtpSettings.smtp_use_tls,
            auth: {
              user: smtpSettings.smtp_username,
              pass: smtpSettings.smtp_password,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EmailService] Test email failed:', errorData);
        return {
          success: false,
          error: errorData.details || 'Failed to send test email',
        };
      }

      const result = await response.json();
      console.log('[EmailService] Test email sent successfully:', result.messageId);

      return { success: true };
    } catch (err) {
      console.error('[EmailService] Network error sending test email:', err);
      return {
        success: false,
        error: 'Network error. Please check your SMTP configuration.',
      };
    }
  } catch (err) {
    console.error('[EmailService] Error testing SMTP:', err);
    return { success: false, error: (err as Error).message };
  }
}
