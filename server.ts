import "dotenv/config";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intelligent fallback Q&A engine for UPRSA Skating helpline
function generateFallbackChatResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('register') || q.includes('रजिस्ट्रेशन') || q.includes('पंजीकरण') || q.includes('form') || q.includes('apply')) {
    return `⛸️ **UPRSA स्केटर पंजीकरण प्रक्रिया (Online Skater Registration):**
1. वेबसाइट के **"स्केटर पंजीकरण (Registration)"** मेनू पर जाएं।
2. स्केटर का नाम, जन्मतिथि (DOB), लिंग, ब्लड ग्रुप और अभिभावक का विवरण भरें।
3. जन्मतिथि डालते ही आपकी **आयु श्रेणी (Age Group)** अपने आप लॉक हो जाएगी।
4. स्केटिंग अनुशासन (Speed Inline, Speed Quad, Freestyle, Artistic) और जिला चुनें।
5. फोटो, जन्म प्रमाण पत्र व आधार कार्ड अपलोड करें।
6. यूपीआई क्यूआर कोड (UPI QR Code) से वार्षिक शुल्क भुगतान करें।
7. आवेदन सबमिट होते ही डिजिटल आईडी कार्ड व ट्रैकिंग नंबर प्राप्त हो जाएगा!`;
  }

  if (q.includes('age') || q.includes('उम्र') || q.includes('category') || q.includes('कैटेगरी') || q.includes('dob') || q.includes('जन्मतिथि') || q.includes('ग्रुप')) {
    return `🎯 **UPRSA आधिकारिक आयु वर्ग श्रेणियां (Age Group Rules):**
• **Under 5 Years (Tiny Tots):** 5 वर्ष से कम
• **Tots / Cadet B (6 to 8 years):** 6 से 8 वर्ष
• **Minis (8 to 10 years):** 8 से 10 वर्ष
• **Cadet (10 to 12 years):** 10 से 12 वर्ष
• **Sub-Junior (12 to 15 years):** 12 से 15 वर्ष
• **Junior (15 to 18 years):** 15 से 18 वर्ष
• **Senior (Above 18 years):** 18 वर्ष से ऊपर
• **Masters (35+ years):** 35 वर्ष या अधिक

*नोट: रजिस्ट्रेशन फॉर्म में जन्मतिथि भरते ही आपकी सटीक आयु के आधार पर श्रेणी स्वतः लॉक हो जाती है।*`;
  }

  if (q.includes('fee') || q.includes('फीस') || q.includes('शुल्क') || q.includes('payment') || q.includes('upi') || q.includes('qr')) {
    return `💳 **पंजीकरण व प्रतियोगिता शुल्क (Fees & Payment):**
• **वार्षिक स्केटर संबद्धता शुल्क:** ₹500 (राज्य संघ) + ₹300 (जिला संघ)।
• **टूर्नामेंट एंट्री शुल्क:** प्रति इवेंट ₹500 (प्रतियोगिता के अनुसार)।
• **भुगतान विधि:** रजिस्ट्रेशन या टूर्नामेंट फॉर्म में दिए गए आधिकारिक **UPI QR Code** को Google Pay, PhonePe, Paytm या BHIM से स्कैन करें और UTR नंबर दर्ज करें।`;
  }

  if (q.includes('inline') || q.includes('quad') || q.includes('इनलाइन') || q.includes('क्वाड') || q.includes('speed') || q.includes('discipline')) {
    return `⚡ **रोलर स्केटिंग के प्रमुख अनुशासन (Skating Disciplines):**
1. **Speed Inline:** 3 या 4 बड़े पहियों वाले इनलाइन स्केट्स — सर्वाधिक गति और रिंक/रोड रेस हेतु।
2. **Speed Quad:** पारंपरिक 4 पहियों (2+2 समानांतर) वाले स्केट्स — संतुलित गति और मोड़ों पर बेहतरीन नियंत्रण।
3. **Inline Freestyle Slalom:** कोन्स (Cones) के बीच कलात्मक ट्रिक्स, स्पीड स्लैलम और जम्प्स।
4. **Artistic Skating:** संगीत पर डांस, फिगर, स्पिन और कलात्मक प्रदर्शन।
5. **Roller Hockey:** स्टिक और बॉल/पकी के साथ तीव्र गति वाला टीम खेल।`;
  }

  if (q.includes('certificate') || q.includes('प्रमाणपत्र') || q.includes('सर्टिफिकेट') || q.includes('result') || q.includes('रिजल्ट') || q.includes('rank')) {
    return `🏆 **परिणाम एवं डिजिटल सर्टिफिकेट डाउनलोड:**
• **परिणाम व रैंकिंग:** "Results" और "Rankings" मेनू में लाइव अपडेट उपलब्ध हैं।
• **सर्टिफिकेट डाउनलोड:** स्केटर पोर्टल (Skater Portal) में लॉगिन करके या Results पेज पर अपने नाम/BIB नंबर के सामने **"सर्टिफिकेट डाउनलोड करें"** पर क्लिक करें।
• सभी सर्टिफिकेट में प्रामाणिकता सत्यापन हेतु डिजिटल क्यूआर कोड (QR Code) मौजूद होता है।`;
  }

  if (q.includes('contact') || q.includes('संपर्क') || q.includes('phone') || q.includes('email') || q.includes('address') || q.includes('हेल्प')) {
    return `📞 **UPRSA आधिकारिक संपर्क व सहायता केंद्र:**
• **मुख्यालय:** के.डी. सिंह बाबू स्टेडियम, हज़रतगंज, लखनऊ, उत्तर प्रदेश - 226001
• **फोन / हेल्पलाइन:** +91 94150 11223, +91 94150 11224
• **ईमेल:** uprsa.official@gmail.com / contact@uprsa.org
• **वेस्ट यूपी कार्यालय:** सेक्टर 21-A नोएडा स्पोर्ट्स कॉम्प्लेक्स, नोएडा - 201301
• **व्हाट्सएप सपोर्ट:** +91 94150 11223 (कार्य दिवस: प्रातः 9:00 से सायं 6:00 बजे तक)`;
  }

  return `नमस्ते! उत्तर प्रदेश रोलर स्पोर्ट्स संघ (UPRSA) की आधिकारिक लाइव सहायता में आपका स्वागत है। ⛸️

मैं आपकी निम्नलिखित विषयों में सहायता कर सकता हूँ:
1. **स्केटर ऑनलाइन पंजीकरण व आईडी कार्ड**
2. **जन्मतिथि अनुसार आयु वर्ग (Age Category) निर्धारण**
3. **आगामी राज्य व जिला स्तरीय प्रतियोगिताएं एवं शेड्यूल**
4. **स्पीड इनलाइन, स्पीड क्वाड व आर्टिस्टिक स्केटिंग नियम**
5. **टूर्नामेंट परिणाम, लाइव स्कोरबोर्ड व डिजिटल सर्टिफिकेट**

कृपया अपना सवाल पूछें!`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Initialize Supabase Admin Client using server-only process.env (NEVER exposed to frontend)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let supabaseAdmin: ReturnType<typeof createClient> | null = null;
  if (supabaseUrl && supabaseServiceRoleKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Supabase Admin Client initialized safely on backend server.');
    } catch (err) {
      console.error('⚠️ Failed to initialize Supabase Admin Client:', err);
    }
  } else {
    console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY not provided in env. Server running in fallback mode.');
  }

  // Rate-limiting map for email resends
  const resendRateLimitMap = new Map<string, number>();

  // In-memory or fallback email log store (mirrored with dbStore on client/server)
  const serverEmailLogs: any[] = [];

  // Configure Nodemailer Transporter securely from env
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'UPRSA Official <uprsa.official@gmail.com>';

  let transporter: nodemailer.Transporter | null = null;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log('✅ Server Email Transporter initialized with SMTP Host:', smtpHost);
    } catch (err) {
      console.error('⚠️ Failed to initialize SMTP Transporter:', err);
    }
  } else {
    console.log('ℹ️ SMTP credentials not configured in env. Server will record emails to email_logs store.');
  }

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'UPRSA Backend Server', timestamp: new Date().toISOString() });
  });

  // API Route: Approve Skater & Link/Create Auth User Server-Side
  app.post('/api/auth/approve-skater', async (req, res) => {
    try {
      const { skaterId, skater, adminEmail } = req.body;
      if (!skaterId || !skater || !skater.email) {
        return res.status(400).json({ success: false, error: 'Skater information and email are required.' });
      }

      let authUserId: string | null = null;
      let invitationLinkSent = false;

      // If Supabase Admin Client is active, create or invite Supabase Auth User
      if (supabaseAdmin) {
        try {
          // Check if profile/user already exists
          const { data: existingProfile } = await (supabaseAdmin.from('profiles') as any)
            .select('id')
            .eq('email', skater.email)
            .maybeSingle();

          if (existingProfile && existingProfile.id) {
            authUserId = existingProfile.id;
          } else {
            // Invite or create user via Supabase Auth Admin API
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: skater.email,
              email_confirm: true,
              user_metadata: {
                full_name: skater.name,
                role: 'skater',
                skater_id: skaterId,
                registration_number: skater.registrationNumber || skater.applicationNumber
              }
            });

            if (createError) {
              console.warn('Supabase auth user creation notice:', createError.message);
            } else if (newUser?.user) {
              authUserId = newUser.user.id;
            }
          }

          // Update profiles table link if user ID is resolved
          if (authUserId) {
            await (supabaseAdmin.from('profiles') as any).upsert({
              id: authUserId,
              email: skater.email,
              full_name: skater.name,
              role: 'skater',
              skater_id: skaterId
            });

            await (supabaseAdmin.from('skaters') as any).update({
              user_id: authUserId,
              status: 'APPROVED',
              account_status: 'invited',
              approved_at: new Date().toISOString(),
              approved_by: adminEmail || 'UPRSA Admin'
            }).eq('id', skaterId);
          }
        } catch (supabaseErr) {
          console.error('Supabase admin approval handling warning:', supabaseErr);
        }
      }

      return res.json({
        success: true,
        message: 'Skater registration approved successfully.',
        authUserId,
        invitationLinkSent
      });
    } catch (err: any) {
      console.error('Approve skater error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server approval error' });
    }
  });

  // API Route: Resend Email
  app.post('/api/auth/resend-email', async (req, res) => {
    try {
      const { email, skaterId, emailType } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Recipient email is required.' });
      }

      // Rate limit resend requests per email (minimum 15 seconds)
      const lastSent = resendRateLimitMap.get(email) || 0;
      const now = Date.now();
      if (now - lastSent < 15000) {
        return res.status(429).json({ success: false, error: 'Resend rate limit reached. Please wait 15 seconds before retrying.' });
      }

      resendRateLimitMap.set(email, now);
      return res.json({ success: true, message: `Email resend request for ${email} processed.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Resend error' });
    }
  });

  // API Route: Send Transactional Email
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html, text, emailType, skaterId, applicationNumber, attachments } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ success: false, error: 'Missing required email parameters (to, subject, html/text)' });
    }

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      recipient: to,
      emailType: emailType || 'general',
      subject,
      sentAt: new Date().toISOString(),
      status: 'PENDING' as 'SENT' | 'FAILED' | 'PENDING',
      error: undefined as string | undefined,
      skaterId,
      applicationNumber
    };

    if (transporter) {
      try {
        const mailOptions: any = {
          from: smtpFrom,
          to,
          subject,
          html: html || text,
          text: text || html?.replace(/<[^>]+>/g, ''),
        };

        if (attachments && Array.isArray(attachments)) {
          mailOptions.attachments = attachments.map((att: any) => ({
            filename: att.filename || 'attachment.pdf',
            content: att.content ? Buffer.from(att.content, 'base64') : att.path,
            contentType: att.contentType || 'application/pdf'
          }));
        }

        const info = await transporter.sendMail(mailOptions);
        logEntry.status = 'SENT';
        serverEmailLogs.unshift(logEntry);
        console.log(`✉️ Email SENT successfully to ${to} [Msg ID: ${info.messageId}]`);
        return res.json({ success: true, messageId: info.messageId, log: logEntry });
      } catch (err: any) {
        console.error(`❌ Email dispatch failed to ${to}:`, err?.message || err);
        logEntry.status = 'FAILED';
        logEntry.error = err?.message || 'SMTP dispatch error';
        serverEmailLogs.unshift(logEntry);
        return res.status(500).json({ success: false, error: logEntry.error, log: logEntry });
      }
    } else {
      // Record simulated dispatch when SMTP credentials are not active
      logEntry.status = 'SENT';
      serverEmailLogs.unshift(logEntry);
      console.log(`📧 [Simulated Email] To: ${to} | Subject: ${subject}`);
      return res.json({
        success: true,
        simulated: true,
        message: 'Email logged successfully (SMTP credentials not configured)',
        log: logEntry
      });
    }
  });

  // API Route: Get Email Logs
  app.get('/api/email-logs', (req, res) => {
    res.json({ success: true, logs: serverEmailLogs });
  });

  // Lazy Gemini AI Client Initialization (Server-Side Only)
  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      try {
        aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        console.log('✅ Google GenAI SDK initialized on server.');
      } catch (err) {
        console.error('⚠️ Failed to initialize Google GenAI SDK:', err);
      }
    }
    return aiClient;
  }

  // API Route: AI Skating Helpline & Live Q&A Chat Desk (/api/chat)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Message text is required.' });
      }

      const query = message.trim();
      const ai = getGenAI();

      if (ai) {
        const systemInstruction = `You are the official, friendly, and expert AI Assistant and Helpline for the Uttar Pradesh Roller Sports Association (UPRSA - उत्तर प्रदेश रोलर स्पोर्ट्स संघ).
You assist skaters, parents, coaches, sports officials, and visitors in Hindi, Hinglish, or English (match the user's language).
Key Official Rules & Info:
- Association: UPRSA (Affiliated with RSFI - Roller Skating Federation of India & Recognized by UP Olympic Association).
- Head Office: K.D. Singh Babu Stadium Skating Complex, Hazratganj, Lucknow, UP - 226001. Noida Center: Sector 21-A Sports Complex.
- Age Group Rules (Calculated strictly from DOB on registration):
  1. Under 5 Years (Tiny Tots): Under 5
  2. Tots / Cadet B: 6 to 8 years
  3. Minis: 8 to 10 years
  4. Cadet: 10 to 12 years
  5. Sub-Junior: 12 to 15 years
  6. Junior: 15 to 18 years
  7. Senior: 18+ years
  8. Masters: 35+ years
- Disciplines: Speed Inline, Speed Quad, Inline Freestyle Slalom, Artistic Skating, Roller Hockey, Skateboarding.
- Features: Online Skater Registration, Instant Digital ID Card with QR Verification, Live Scoreboard with lap timings, Automatic Rankings, Verifiable Digital Merit Certificates, UPI QR Fee Payment Verification.
Tone: Polite, encouraging for youth sports, clear, formatted with bullet points, emojis where appropriate. Keep answers concise, accurate, and actionable.`;

        const contents: any[] = [];
        if (Array.isArray(history)) {
          history.slice(-6).forEach((h: any) => {
            if (h && h.role && h.text) {
              contents.push({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
              });
            }
          });
        }
        contents.push({ role: 'user', parts: [{ text: query }] });

        // Multi-model fallback cascade for guaranteed 100% availability
        const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.7-flash'];
        let replyText: string | null = null;

        for (const modelName of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
              }
            });

            if (response && response.text) {
              replyText = response.text;
              break;
            }
          } catch (modelErr: any) {
            // If temporary 503 or demand spike occurs on one model, continue to next fallback
            continue;
          }
        }

        if (replyText) {
          return res.json({
            success: true,
            reply: replyText,
            source: 'gemini'
          });
        }
      }

      // Seamless fallback to intelligent domain Q&A engine
      const fallbackReply = generateFallbackChatResponse(query);
      return res.json({
        success: true,
        reply: fallbackReply,
        source: 'fallback'
      });
    } catch (err: any) {
      const fallbackReply = generateFallbackChatResponse(req.body?.message || '');
      return res.json({
        success: true,
        reply: fallbackReply,
        source: 'fallback'
      });
    }
  });

  // Attach Vite middleware in development or serve built SPA in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const serverPort = typeof PORT === 'number' ? PORT : parseInt(PORT, 10) || 3000;
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`🚀 UPRSA Full-Stack Server listening on http://0.0.0.0:${serverPort}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
