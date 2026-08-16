import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { sendSkaterEmail } from '../../lib/emailService';
import { EmailTemplate, EmailLog } from '../../types';
import { Mail, FileText, CheckCircle2, XCircle, Clock, Edit3, Send, Search, RefreshCw, AlertCircle, Code, ShieldCheck } from 'lucide-react';

export const EmailManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'test'>('templates');

  const templates = dbStore.getEmailTemplates();
  const logs = dbStore.getEmailLogs();

  // Selected Template for Editing
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Search in Email Logs
  const [logSearch, setLogSearch] = useState('');

  // Test Email State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const filteredLogs = logs.filter(l => 
    l.recipient.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.subject.toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.applicationNumber && l.applicationNumber.toLowerCase().includes(logSearch.toLowerCase()))
  );

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    dbStore.updateEmailTemplate(editingTemplate.id, editingTemplate);
    setEditingTemplate(null);
    alert('Email Template updated successfully!');
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient.trim()) return;

    setIsSendingTest(true);
    setTestEmailStatus(null);

    const skaters = dbStore.getSkaters();
    const sampleSkater = skaters[0] || {
      id: 'skater-sample',
      applicationNumber: 'UPRSA-APP-2026-000001',
      registrationNumber: 'UPRSA-LKO-00001',
      name: 'Sample Test Skater',
      fatherMotherName: 'Parent Name',
      dob: '2010-01-01',
      age: 16,
      gender: 'Male',
      ageGroup: 'Junior (15-18 Years)',
      mobile: '+91 98390 12345',
      email: testEmailRecipient,
      address: 'Lucknow, Uttar Pradesh',
      districtId: 'dist-1',
      districtName: 'Lucknow',
      clubId: 'club-1',
      clubName: 'Lucknow Roller Skating Academy',
      discipline: 'Speed Inline',
      category: 'State',
      validityUntil: '2027-03-31',
      status: 'approved' as const,
      loginId: 'UPRSA-LKO-00001',
      tempPassword: 'UPRSA@2026',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      emergencyContactName: 'Parent Name',
      emergencyContactPhone: '+91 98390 12345',
      createdAt: new Date().toISOString()
    };

    const res = await sendSkaterEmail({
      to: testEmailRecipient,
      templateKey: 'registration_approved',
      skater: sampleSkater
    });

    setIsSendingTest(false);
    if (res.success) {
      setTestEmailStatus('✅ Test email sent successfully! Check recipient inbox or SMTP logs.');
    } else {
      setTestEmailStatus(`❌ Email dispatch error: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Mail className="w-7 h-7 text-amber-500" />
            Email Templates & Transactional Dispatch Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage official UPRSA email communication templates, SMTP delivery status, and logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Email Templates ({templates.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" /> Email Logs ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'test' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4 text-blue-400" /> Send Test Email
          </button>
        </div>
      </div>

      {/* Tab 1: Templates List */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-500 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                      Key: {tpl.key}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1">{tpl.nameEn}</h3>
                  </div>

                  <button
                    onClick={() => setEditingTemplate(tpl)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit Template
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-400 font-semibold">Subject (English):</p>
                  <p className="font-mono text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-[11px]">{tpl.subjectEn}</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-400 font-semibold">Body Preview:</p>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {tpl.bodyEn}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Variables:</span>
                  {tpl.variables.map(v => (
                    <span key={v} className="px-1.5 py-0.5 bg-slate-950 text-amber-400 font-mono text-[10px] rounded border border-slate-800">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Email Dispatch Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search logs by recipient email or subject..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full font-semibold"
            />
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Template Type</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        {log.recipient}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        {log.emailType}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">
                        {log.subject}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.status === 'SENT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          log.status === 'FAILED' ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                        No email dispatch records found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Send Test Email */}
      {activeTab === 'test' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              SMTP Connection Test Utility
            </h3>
            <p className="text-xs text-slate-400">
              Dispatch a test UPRSA registration approval email to verify server email delivery
            </p>
          </div>

          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Recipient Test Email Address
              </label>
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                required
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {testEmailStatus && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200">
                {testEmailStatus}
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingTest}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSendingTest ? 'Sending Test Email...' : 'Send Test Approval Email'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Edit Email Template: {editingTemplate.nameEn}</h3>
                <p className="text-xs text-slate-400">Customize email subject and body placeholders</p>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject (English)</label>
                <input
                  type="text"
                  value={editingTemplate.subjectEn}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subjectEn: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject (Hindi)</label>
                <input
                  type="text"
                  value={editingTemplate.subjectHi}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subjectHi: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Body (English)</label>
                <textarea
                  rows={8}
                  value={editingTemplate.bodyEn}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyEn: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Body (Hindi)</label>
                <textarea
                  rows={8}
                  value={editingTemplate.bodyHi}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyHi: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-slate-400">
                  Available Variables: {editingTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
