import React, { useState, useEffect } from 'react';
import { runQualificationTestSuite, TestResultReport } from '../../../lib/qualificationEngine.test';
import { CheckCircle, XCircle, Shield, RefreshCw, X } from 'lucide-react';

interface QualificationTestRunnerModalProps {
  onClose: () => void;
}

export const QualificationTestRunnerModal: React.FC<QualificationTestRunnerModalProps> = ({ onClose }) => {
  const [reports, setReports] = useState<TestResultReport[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runQualificationTestSuite();
      setReports(results);
      setIsRunning(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const total = reports.length;
  const passedCount = reports.filter(r => r.passed).length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-6 text-slate-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-extrabold text-white">500M & 1000M Qualification System Automated Tests</h3>
              <p className="text-xs text-slate-400">Verifying deterministic qualification, tie handling, and DNS/DNF/DSQ rules</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">TestSuite Status</div>
            <div className="text-xl font-black text-white">{passedCount} / {total} Tests Passed</div>
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} /> Run Verification
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {reports.map((report, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              {report.passed ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-white">{report.testName}</div>
                <div className="text-xs text-slate-400 font-mono">{report.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
