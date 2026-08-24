import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Upload, HelpCircle, Shield, FileText, User } from 'lucide-react';
import { CitizenInterface } from '../components/CitizenInterface';
import { JourneyStepper, JourneyStepStage } from '../components/JourneyStepper';
import { VoiceWidget } from '../components/VoiceWidget';
import { SafeAutofillProfile, SafeProfileData } from '../components/SafeAutofillProfile';

interface ApplicationWorkspacePageProps {
  onNavigate: (route: string) => void;
  onOpenNira: (query?: string) => void;
}

type WorkspaceState = 'details' | 'documents' | 'review';

export const ApplicationWorkspacePage: React.FC<ApplicationWorkspacePageProps> = ({
  onNavigate,
  onOpenNira,
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'service' | 'train'>('service');
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('details');
  const [journeyStage, setJourneyStage] = useState<JourneyStepStage>('INTENT');

  // Form State
  const [fullName, setFullName] = useState('Pratay Karali');
  const [dob, setDob] = useState('1998-05-14');
  const [address, setAddress] = useState('72 Park Street, Kolkata, West Bengal 700016');

  // Documents State
  const [docsUploaded, setDocsUploaded] = useState({
    identity: true,
    address: true,
    supporting: false,
  });

  const handleAutofill = (profile: SafeProfileData) => {
    if (profile.full_name) setFullName(profile.full_name);
  };

  const handleVoiceIntentParsed = (intent: any) => {
    if (intent.source_station || intent.destination_station) {
      setActiveTabMode('train');
      setJourneyStage('SEARCH');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 6-STEP VISUAL PROGRESS STEPPER */}
      <JourneyStepper
        currentStage={journeyStage}
        onSelectStage={(stage) => setJourneyStage(stage)}
      />

      {/* MODE TOGGLE: CIVIC APPLICATION VS TRAIN JOURNEY */}
      <div className="flex items-center justify-between bg-[#091024]/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabMode('service')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'service'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Civic Application Workspace
          </button>
          <button
            onClick={() => setActiveTabMode('train')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'train'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Train Journey Booking Engine
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Application ID: <span className="text-white font-bold">NTR-20482</span>
        </div>
      </div>

      {/* VOICE INTERFACE ASSISTANT & SAFE AUTOFILL PROFILE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VoiceWidget onIntentParsed={handleVoiceIntentParsed} />
        <SafeAutofillProfile onAutofill={handleAutofill} />
      </div>

      {activeTabMode === 'train' ? (
        <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 backdrop-blur-md">
          <CitizenInterface />
        </div>
      ) : (
        /* 3-COLUMN WORKSPACE LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANE: JOURNEY PROGRESS */}
          <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-[#091024]/80 p-6 space-y-6 backdrop-blur-md h-fit">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Journey Progress
            </h3>

            <div className="space-y-4 text-xs font-medium">
              {[
                { id: 'guide', label: '01 Guide', done: true, current: false },
                { id: 'details', label: '02 Details', done: workspaceState !== 'details', current: workspaceState === 'details' },
                { id: 'documents', label: '03 Documents', done: workspaceState === 'review', current: workspaceState === 'documents' },
                { id: 'review', label: '04 Review', done: false, current: workspaceState === 'review' },
                { id: 'pay', label: '05 Payment', done: false, current: false },
                { id: 'submit', label: '06 Submit', done: false, current: false },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : step.current ? (
                    <span className="h-4 w-4 rounded-full bg-indigo-500 border-2 border-white animate-pulse shrink-0" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <span
                    className={
                      step.current
                        ? 'font-bold text-white text-sm'
                        : step.done
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Session state protected by Kavach & Dhara admission rules.
            </div>
          </div>

          {/* CENTER PANE: CURRENT TASK */}
          <div className="lg:col-span-6 rounded-3xl border border-white/10 bg-[#091024]/90 p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl">
            {/* STATE A: DETAILS */}
            {workspaceState === 'details' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">State A — Details</span>
                  <h2 className="text-2xl font-display font-bold text-white mt-1">Enter Applicant Details</h2>
                  <p className="text-xs text-slate-400">Enter synthetic or verified information to proceed.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#050914] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#050914] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Residential Address</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#050914] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setWorkspaceState('documents');
                      setJourneyStage('PASSENGER');
                    }}
                    className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                  >
                    Continue to Documents <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STATE B: DOCUMENTS */}
            {workspaceState === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">State B — Documents</span>
                  <h2 className="text-2xl font-display font-bold text-white mt-1">Upload Required Proofs</h2>
                  <p className="text-xs text-slate-400">Attach clean PDF or JPG files under 5MB.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Identity Proof (Aadhaar / Passport)</h4>
                        <p className="text-[11px] text-slate-400 font-mono">identity_masked.pdf (Uploaded)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                      Verified
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Address Proof (Electricity Bill)</h4>
                        <p className="text-[11px] text-slate-400 font-mono">electricity_bill_2026.pdf (Uploaded)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                      Verified
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Supporting Document (Self Declaration)</h4>
                        <p className="text-[11px] text-slate-400">Click to upload or drag file here</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDocsUploaded((prev) => ({ ...prev, supporting: true }))}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      {docsUploaded.supporting ? 'Uploaded ✓' : 'Upload'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setWorkspaceState('details');
                      setJourneyStage('CONFIRM');
                    }}
                    className="px-5 py-3 rounded-2xl border border-white/20 text-slate-300 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setWorkspaceState('review');
                      setJourneyStage('REVIEW');
                    }}
                    className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                  >
                    Proceed to Review <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STATE C: REVIEW */}
            {workspaceState === 'review' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">State C — Review</span>
                  <h2 className="text-2xl font-display font-bold text-white mt-1">Check before submitting</h2>
                  <p className="text-xs text-slate-400">Verify your details carefully before proceeding to Payment Bridge.</p>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-slate-400 font-mono">Applicant Name:</span>
                    <span className="font-bold text-white">{fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-slate-400 font-mono">Date of Birth:</span>
                    <span className="font-bold text-white">{dob}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-slate-400 font-mono">Address:</span>
                    <span className="font-bold text-white text-right max-w-xs">{address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Statutory Fee:</span>
                    <span className="font-bold text-emerald-400">₹50</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setWorkspaceState('documents');
                      setJourneyStage('PASSENGER');
                    }}
                    className="px-5 py-3 rounded-2xl border border-white/20 text-slate-300 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setJourneyStage('PAY');
                      onNavigate('payment');
                    }}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all flex items-center gap-2 shadow-xl shadow-purple-500/25"
                  >
                    Proceed to Payment Bridge <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: CONTEXTUAL HELP */}
          <div className="lg:col-span-3 rounded-3xl border border-indigo-500/20 bg-[#091024]/80 p-6 space-y-4 backdrop-blur-md h-fit">
            <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Contextual Help
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <h4 className="font-bold text-white">Why do we need this?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your address details are matched against statutory revenue records to prevent duplicate applications.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <h4 className="font-bold text-white">Data Privacy</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kavach gateway automatically masks personal details. Zero PII leakage guaranteed.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenNira('Why do we need applicant address verification?')}
              className="w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask Nira about this step
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
