import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse request body
    const payload: EmailPayload = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!payload.to || !payload.from || !payload.subject || !payload.smtpConfig) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('[send-email] Sending email to:', payload.to);
    console.log('[send-email] SMTP Host:', payload.smtpConfig.host);
    console.log('[send-email] SMTP Port:', payload.smtpConfig.port);
    console.log('[send-email] Use TLS:', payload.smtpConfig.secure);

    // Determine the correct secure flag based on port
    // Port 465 uses direct SSL/TLS (secure: true)
    // Port 587 uses STARTTLS (secure: false, but requireTLS: true)
    // Port 25 typically uses plain or STARTTLS (secure: false)
    const isSecurePort = payload.smtpConfig.port === 465;
    const shouldUseTLS = payload.smtpConfig.secure || payload.smtpConfig.port === 587;

    console.log('[send-email] Computed secure flag:', isSecurePort);
    console.log('[send-email] Should use TLS/STARTTLS:', shouldUseTLS);

    // Create nodemailer transporter with SMTP config
    const transporter = nodemailer.createTransport({
      host: payload.smtpConfig.host,
      port: payload.smtpConfig.port,
      secure: isSecurePort, // true for 465, false for 587/25
      auth: {
        user: payload.smtpConfig.auth.user,
        pass: payload.smtpConfig.auth.pass,
      },
      // TLS options
      requireTLS: shouldUseTLS && !isSecurePort, // Use STARTTLS for non-465 ports when TLS is enabled
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        minVersion: 'TLSv1.2', // Ensure modern TLS version
      },
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('[send-email] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('[send-email] SMTP verification failed:', verifyError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'SMTP connection failed',
          details: (verifyError as Error).message,
        }),
      };
    }

    // Send email
    const info = await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    console.log('[send-email] Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
      }),
    };
  } catch (error) {
    console.error('[send-email] Error sending email:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send email',
        details: (error as Error).message,
      }),
    };
  }
};
