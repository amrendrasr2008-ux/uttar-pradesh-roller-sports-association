import { dbStore } from './db';
import { Skater, EmailTemplate } from '../types';

export interface SendEmailOptions {
  to: string;
  templateKey: 'registration_received' | 'registration_verified' | 'registration_under_review' | 'registration_approved' | 'registration_rejected' | 'account_activation' | 'password_reset' | 'credentials_set';
  skater: Skater;
  customVariables?: Record<string, string>;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export async function sendSkaterEmail(options: SendEmailOptions): Promise<{ success: boolean; message?: string }> {
  const { to, templateKey, skater, customVariables, attachments } = options;

  const templates = dbStore.getEmailTemplates();
  const template = templates.find(t => t.key === templateKey);

  const appUrl = window.location.origin;
  const activationUrl = `${appUrl}/activate?email=${encodeURIComponent(to)}&reg=${encodeURIComponent(skater.registrationNumber || skater.applicationNumber || '')}`;

  // Replacement dictionary for template placeholders
  const vars: Record<string, string> = {
    skater_name: skater.name,
    application_number: skater.applicationNumber || 'UPRSA-APP-2026-000001',
    registration_number: skater.registrationNumber || 'PENDING',
    district: skater.districtName || 'Uttar Pradesh',
    club: skater.clubName || 'Affiliated Club',
    discipline: skater.discipline || 'Inline Speed',
    status: (skater.status || 'PENDING_VERIFICATION').toUpperCase().replace(/_/g, ' '),
    login_id: skater.registrationNumber || skater.applicationNumber || skater.email || '',
    rejection_reason: skater.rejectionReason || 'Document verification required.',
    activation_link: activationUrl,
    portal_url: `${appUrl}/skater-portal`,
    ...customVariables
  };

  let subject = template?.subjectEn;
  if (!subject) {
    if (templateKey === 'registration_received') {
      subject = `UPRSA Registration Received – ${vars.registration_number}`;
    } else if (templateKey === 'registration_verified') {
      subject = `UPRSA Registration Verification Update – ${vars.registration_number}`;
    } else if (templateKey === 'registration_approved' || templateKey === 'account_activation') {
      subject = `UPRSA Registration Approved & Account Activation – ${vars.registration_number}`;
    } else if (templateKey === 'registration_rejected') {
      subject = `UPRSA Registration Update – ${vars.registration_number}`;
    } else if (templateKey === 'password_reset') {
      subject = `UPRSA Password Reset Request – ${vars.registration_number}`;
    } else {
      subject = `UPRSA Official Notification – ${vars.registration_number}`;
    }
  }

  let body = template?.bodyEn;
  if (!body) {
    if (templateKey === 'registration_received') {
      body = `Dear ${vars.skater_name},

Your registration with the Uttar Pradesh Roller Sports Association has been successfully received.

Registration Number: ${vars.registration_number}
Status: Pending Verification
District: ${vars.district}
Club / Academy: ${vars.club}
Discipline: ${vars.discipline}

We will notify you after verification and approval.

Regards,
Uttar Pradesh Roller Sports Association
UPRSA`;
    } else if (templateKey === 'registration_verified') {
      body = `Dear ${vars.skater_name},

Your documents and registration details with the Uttar Pradesh Roller Sports Association have been verified.

Registration Number: ${vars.registration_number}
Status: Verified
District: ${vars.district}
Club / Academy: ${vars.club}

Your registration is now awaiting final administrative approval.

Regards,
Uttar Pradesh Roller Sports Association
UPRSA`;
    } else if (templateKey === 'registration_approved' || templateKey === 'account_activation') {
      body = `Dear ${vars.skater_name},

Congratulations! Your registration with the Uttar Pradesh Roller Sports Association has been APPROVED.

Registration Number: ${vars.registration_number}
District: ${vars.district}
Club / Academy: ${vars.club}
Discipline: ${vars.discipline}
Status: Approved

Please click the secure activation link below to set your account password and activate your Skater Portal access:
${vars.activation_link}

Regards,
Uttar Pradesh Roller Sports Association
UPRSA`;
    } else if (templateKey === 'registration_rejected') {
      body = `Dear ${vars.skater_name},

Your registration with the Uttar Pradesh Roller Sports Association has been rejected.

Registration Number: ${vars.registration_number}
Status: Rejected
Reason: ${vars.rejection_reason}

Please log in to update your documents or contact your District Secretary for assistance.

Regards,
Uttar Pradesh Roller Sports Association
UPRSA`;
    } else {
      body = `Dear ${vars.skater_name},\n\nYour UPRSA registration status: ${vars.status}.\nRegistration No: ${vars.registration_number}`;
    }
  }

  // Replace placeholders in subject and body
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    subject = subject.replace(regex, vars[key]);
    body = body.replace(regex, vars[key]);
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 2px solid #f59e0b;">
        <h2 style="color: #fbbf24; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">UTTAR PRADESH ROLLER SPORTS ASSOCIATION</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 11px;">Recognized by U.P. Olympic Association & RSFI</p>
      </div>
      <div style="padding: 25px; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">${body}</div>
      <div style="background-color: #1e293b; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        This is an automated official email from UPRSA. Please do not reply directly to this email.<br/>
        Visit <a href="${appUrl}" style="color: #fbbf24; text-decoration: none;">uprollersports.org</a> for support.
      </div>
    </div>
  `;

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent,
        text: body,
        emailType: templateKey,
        skaterId: skater.id,
        applicationNumber: skater.applicationNumber,
        attachments
      })
    });

    const rawResponse = await response.text();

let data: any;

try {
  data = rawResponse ? JSON.parse(rawResponse) : {
    success: false,
    message: `Server returned an empty response (HTTP ${response.status})`
  };
} catch {
  data = {
    success: false,
    message: rawResponse || `Server returned invalid JSON (HTTP ${response.status})`
  };
}

    if (data.log) {
      dbStore.addEmailLog({
        recipient: to,
        emailType: templateKey,
        subject,
        status: data.log.status || (data.success ? 'SENT' : 'FAILED'),
        error: data.log.error,
        skaterId: skater.id,
        applicationNumber: skater.applicationNumber
      });
    }

    return { success: data.success, message: data.message };
  } catch (err: any) {
    console.error('Email dispatch client error:', err);
    dbStore.addEmailLog({
      recipient: to,
      emailType: templateKey,
      subject,
      status: 'FAILED',
      error: err?.message || 'Network dispatch error',
      skaterId: skater.id,
      applicationNumber: skater.applicationNumber
    });
    return { success: false, message: err?.message || 'Network dispatch error' };
  }
}

export async function sendAdminOtpEmail(to: string, otp: string): Promise<{ success: boolean; message?: string }> {
  const appUrl = window.location.origin;
  const subject = `UPRSA Admin Portal Security OTP: ${otp} | पासवर्ड परिवर्तन हेतु सुरक्षा कोड`;
  const body = `Dear Admin,

An OTP request has been initiated to change the Admin Portal Login Credentials for the Uttar Pradesh Roller Sports Association (UPRSA).

• Security Verification OTP: ${otp}
• Registered Admin Email: ${to}
• Time Stamp: ${new Date().toLocaleString()}

Please enter this OTP in your Admin Portal Security Settings to complete the credentials update. Do NOT share this security code with anyone.

Regards,
Uttar Pradesh Roller Sports Association (UPRSA)`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 2px solid #f59e0b;">
        <h2 style="color: #fbbf24; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">UTTAR PRADESH ROLLER SPORTS ASSOCIATION</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 11px;">Admin Portal Security & Password Reset</p>
      </div>
      <div style="padding: 30px; text-align: center; line-height: 1.6;">
        <p style="color: #cbd5e1; font-size: 14px; margin-top: 0;">एडमिन पोर्टल का आईडी व पासवर्ड बदलने हेतु आपका सुरक्षा OTP:</p>
        <div style="background-color: #020617; border: 2px dashed #f59e0b; padding: 18px; border-radius: 12px; margin: 20px 0; display: inline-block;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #fbbf24; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">यह ओटीपी अगले 10 मिनट के लिए मान्य है। कृपया इसे किसी के साथ साझा न करें।</p>
      </div>
      <div style="background-color: #1e293b; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        Automated Security Dispatch | <a href="${appUrl}" style="color: #fbbf24; text-decoration: none;">uprollersports.org</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent,
        text: body,
        emailType: 'admin_otp'
      })
    });

    const data = await response.json();
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'admin_otp' as any,
      subject,
      status: data.success ? 'SENT' : 'FAILED',
      error: data.message
    });

    return { success: data.success, message: data.message };
  } catch (err: any) {
    console.error('Admin OTP email error:', err);
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'admin_otp' as any,
      subject,
      status: 'FAILED',
      error: err?.message || 'Network error'
    });
    return { success: false, message: err?.message || 'Network error' };
  }
}

export async function sendPaymentConfirmationEmail(options: {
  to: string;
  skaterName: string;
  registrationNumber: string;
  tournamentName: string;
  amount: number;
  utrNumber: string;
  verifiedAt: string;
}): Promise<{ success: boolean; message?: string }> {
  const { to, skaterName, registrationNumber, tournamentName, amount, utrNumber, verifiedAt } = options;
  const appUrl = window.location.origin;
  const subject = `UPRSA Tournament Payment Confirmed – ${registrationNumber}`;

  const textBody = `Dear ${skaterName},

Your tournament payment has been successfully verified by UPRSA Admin.

Registration Number: ${registrationNumber}
Tournament: ${tournamentName}
Amount Paid: ₹${amount}
UTR / Transaction ID: ${utrNumber}
Payment Status: VERIFIED
Verification Date: ${new Date(verifiedAt).toLocaleString()}

Your tournament registration is now confirmed. You can view your receipt in the Skater Portal.

Regards,
Uttar Pradesh Roller Sports Association (UPRSA)`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 2px solid #10b981;">
        <h2 style="color: #34d399; margin: 0; font-size: 18px; text-transform: uppercase;">UPRSA TOURNAMENT PAYMENT CONFIRMED</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 11px;">Uttar Pradesh Roller Sports Association</p>
      </div>
      <div style="padding: 25px; line-height: 1.6;">
        <p style="color: #cbd5e1; font-size: 14px;">प्रिय ${skaterName},</p>
        <p style="color: #cbd5e1; font-size: 14px;">आपका टूर्नामेंट शुल्क भुगतान UPRSA एडमिन द्वारा सफलतापूर्वक सत्यापित (VERIFIED) कर दिया गया है।</p>
        <div style="background-color: #020617; border: 1px solid #334155; padding: 18px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>पंजीकरण संख्या:</strong> <span style="color: #38bdf8;">${registrationNumber}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>टूर्नामेंट:</strong> ${tournamentName}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>भुगतान राशि:</strong> ₹${amount}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>UTR / Transaction ID:</strong> <span style="color: #fbbf24; font-family: monospace;">${utrNumber}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>स्थिति:</strong> <span style="color: #34d399; font-weight: bold;">VERIFIED</span></p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">आप स्केटर पोर्टल में जाकर अपनी डिजिटल भुगतान रसीद देख व डाउनलोड कर सकते हैं।</p>
      </div>
      <div style="background-color: #1e293b; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        Official Dispatch | <a href="${appUrl}/skater-portal" style="color: #38bdf8; text-decoration: none;">UPRSA Skater Portal</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent,
        text: textBody,
        emailType: 'payment_confirmed'
      })
    });

    const data = await response.json();
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'payment_confirmed' as any,
      subject,
      status: data.success ? 'SENT' : 'FAILED',
      error: data.message
    });

    return { success: data.success, message: data.message };
  } catch (err: any) {
    console.error('Payment confirmation email error:', err);
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'payment_confirmed' as any,
      subject,
      status: 'FAILED',
      error: err?.message || 'Network error'
    });
    return { success: false, message: err?.message || 'Network error' };
  }
}

export async function sendPaymentRejectionEmail(options: {
  to: string;
  skaterName: string;
  registrationNumber: string;
  tournamentName: string;
  amount: number;
  utrNumber: string;
  rejectionReason: string;
}): Promise<{ success: boolean; message?: string }> {
  const { to, skaterName, registrationNumber, tournamentName, amount, utrNumber, rejectionReason } = options;
  const appUrl = window.location.origin;
  const subject = `UPRSA Tournament Payment Rejected – ${registrationNumber}`;

  const textBody = `Dear ${skaterName},

Your tournament payment submission update:

Registration Number: ${registrationNumber}
Tournament: ${tournamentName}
Amount: ₹${amount}
UTR / Transaction ID: ${utrNumber}
Payment Status: REJECTED
Reason: ${rejectionReason}

Please log into the Skater Portal to update and re-submit your payment details or contact UPRSA support.

Regards,
Uttar Pradesh Roller Sports Association (UPRSA)`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 2px solid #ef4444;">
        <h2 style="color: #f87171; margin: 0; font-size: 18px; text-transform: uppercase;">UPRSA TOURNAMENT PAYMENT REJECTED</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 11px;">Uttar Pradesh Roller Sports Association</p>
      </div>
      <div style="padding: 25px; line-height: 1.6;">
        <p style="color: #cbd5e1; font-size: 14px;">प्रिय ${skaterName},</p>
        <p style="color: #cbd5e1; font-size: 14px;">आपके द्वारा प्रस्तुत किया गया टूर्नामेंट शुल्क भुगतान अस्वीकृत (REJECTED) कर दिया गया है।</p>
        <div style="background-color: #020617; border: 1px solid #ef4444; padding: 18px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>पंजीकरण संख्या:</strong> ${registrationNumber}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>टूर्नामेंट:</strong> ${tournamentName}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>UTR / Transaction ID:</strong> ${utrNumber}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>अस्वीकृति का कारण:</strong> <span style="color: #f87171; font-weight: bold;">${rejectionReason}</span></p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">कृपया स्केटर पोर्टल में जाकर सही यूटीआर व पेमेंट स्क्रीनशॉट पुनः प्रस्तुत करें या हेल्पडेस्क से संपर्क करें।</p>
      </div>
      <div style="background-color: #1e293b; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        Official Dispatch | <a href="${appUrl}/skater-portal" style="color: #f87171; text-decoration: none;">UPRSA Skater Portal</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent,
        text: textBody,
        emailType: 'payment_rejected'
      })
    });

    const data = await response.json();
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'payment_rejected' as any,
      subject,
      status: data.success ? 'SENT' : 'FAILED',
      error: data.message
    });

    return { success: data.success, message: data.message };
  } catch (err: any) {
    console.error('Payment rejection email error:', err);
    dbStore.addEmailLog({
      recipient: to,
      emailType: 'payment_rejected' as any,
      subject,
      status: 'FAILED',
      error: err?.message || 'Network error'
    });
    return { success: false, message: err?.message || 'Network error' };
  }
}

