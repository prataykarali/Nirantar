import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Save,
  Users,
  Settings as SettingsIcon,
  Link,
  LogOut,
  Plus,
  Trash2,
  KeyRound,
  ExternalLink,
  Camera,
  X,
  Check,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { JargonHint } from '../components/JargonHint';
import { TopUpWalletModal } from '../components/payment/TopUpWalletModal';

export interface CitizenAvatar {
  id: string;
  name: string;
  role: string;
  badge: string;
  url: string;
}

export const CITIZEN_AVATARS: CitizenAvatar[] = [
  {
    id: 'avatar_1',
    name: 'Aarav',
    role: 'Student & Youth Explorer',
    badge: 'Student',
    url: '/assets/images/avatars/avatar_1_student.svg',
  },
  {
    id: 'avatar_2',
    name: 'Sharma Ji',
    role: 'Senior Citizen Veteran',
    badge: 'Senior 60+',
    url: '/assets/images/avatars/avatar_2_senior.svg',
  },
  {
    id: 'avatar_3',
    name: 'Ananya',
    role: 'Software Engineer & AI Enthusiast',
    badge: 'Tech Professional',
    url: '/assets/images/avatars/avatar_3_techie.svg',
  },
  {
    id: 'avatar_4',
    name: 'Rohan',
    role: 'Daily Intercity Express Commuter',
    badge: 'Daily Commuter',
    url: '/assets/images/avatars/avatar_4_commuter.svg',
  },
  {
    id: 'avatar_5',
    name: 'Pooja',
    role: 'Family Vacation Planner',
    badge: 'Family Travel',
    url: '/assets/images/avatars/avatar_5_family.svg',
  },
  {
    id: 'avatar_6',
    name: 'Kabir',
    role: 'Travel Blogger & Lensman',
    badge: 'Creator',
    url: '/assets/images/avatars/avatar_6_photographer.svg',
  },
  {
    id: 'avatar_7',
    name: 'Dr. Meera',
    role: 'Medical & Healthcare Professional',
    badge: 'Doctor',
    url: '/assets/images/avatars/avatar_7_doctor.svg',
  },
  {
    id: 'avatar_8',
    name: 'Vikram',
    role: 'Startup Founder & Business Nomad',
    badge: 'Entrepreneur',
    url: '/assets/images/avatars/avatar_8_entrepreneur.svg',
  },
  {
    id: 'avatar_9',
    name: 'Tanvi',
    role: 'Railway Heritage Explorer',
    badge: 'Rail Enthusiast',
    url: '/assets/images/avatars/avatar_9_rail_enthusiast.svg',
  },
  {
    id: 'avatar_10',
    name: 'Nira Pilot',
    role: 'AI-Assisted Co-Pilot Passenger',
    badge: 'AI Guide',
    url: '/assets/images/avatars/avatar_10_nira_guide.svg',
  },
];

export const ProfilePage: React.FC = () => {
  const { navigateTo, authState, setAuthState, walletBalance, savedPassengers, addNotification, securityPin, setSecurityPin, citizenProfile } = useJourney();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'GOOGLE' | 'DIGILOCKER'>('LOGIN');

  // Security PIN states with Eye Toggle
  const [showPin, setShowPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Form State
  const [profile, setProfile] = useState({
    fullName: authState.displayName || citizenProfile?.name || 'Pratay Karali',
    phoneNumber: authState.phone || citizenProfile?.phone || '8420773730',
    email: authState.email || citizenProfile?.email || 'pratay.karali@gov.in',
    dob: '15 Aug 2005',
    aadhaarNumber: 'XXXX-XXXX-9421',
    accountNumber: citizenProfile?.accountNumber || 'CIT-9842-8812-IN',
    walletAccountNumber: citizenProfile?.walletAccountNumber || 'VA-8829-4102-991',
    irctcId: citizenProfile?.irctcId || 'PRATAY_K2026',
  });

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length < 4) {
      setPinMessage('PIN must be at least 4 digits');
      return;
    }
    setSecurityPin(newPinInput.trim());
    setIsChangingPin(false);
    setNewPinInput('');
    setPinMessage('✓ Personal Security PIN updated successfully!');
    addNotification({
      title: '🔒 Security PIN Updated',
      body: 'Your 4-digit verification PIN has been successfully changed.',
      type: 'info',
    });
    setTimeout(() => setPinMessage(null), 3000);
  };

  // Auth Modal State
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalAadhaar, setModalAadhaar] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const handleSelectAvatar = (avatarUrl: string, avatarName?: string) => {
    setAuthState((prev) => ({
      ...prev,
      avatarUrl,
    }));
    setShowAvatarModal(false);
    addNotification({
      title: '👤 Profile Avatar Updated',
      body: `Avatar updated to ${avatarName || 'Selected Citizen Persona'}.`,
      type: 'info',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setAuthState((prev) => ({
      ...prev,
      displayName: profile.fullName,
      email: profile.email,
      phone: profile.phoneNumber,
    }));
    addNotification({
      title: '✓ Profile Details Saved',
      body: 'Citizen profile changes successfully persisted.',
      type: 'info',
    });
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: modalName || 'New Citizen',
          username: modalEmail.split('@')[0] || modalPhone || `user_${Date.now()}`,
          email: modalEmail || `${modalPhone}@nirantar.gov.in`,
          phone: modalPhone,
          password: modalPassword || 'nirantar2026',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthState({
          status: 'READY',
          userId: data.userId,
          displayName: data.displayName,
          email: data.email,
          phone: modalPhone,
          avatarUrl: data.avatarUrl || '/assets/images/avatars/avatar_1_student.svg',
          isAuthenticated: true,
          failureReason: null,
        });
        setProfile((prev) => ({
          ...prev,
          fullName: data.displayName,
          email: data.email || prev.email,
          phoneNumber: modalPhone || prev.phoneNumber,
        }));
        setShowAuthModal(false);
        setAuthMessage('Account created and saved in Database successfully!');
      } else {
        const err = await res.json();
        setAuthMessage(err.detail || 'Failed to create account.');
      }
    } catch {
      // Fallback local update
      setAuthState({
        status: 'READY',
        userId: `user_${Date.now()}`,
        displayName: modalName || 'New Citizen',
        email: modalEmail || 'citizen@nirantar.gov.in',
        phone: modalPhone || '9876543210',
        avatarUrl: '/assets/images/avatars/avatar_1_student.svg',
        isAuthenticated: true,
        failureReason: null,
      });
      setProfile((prev) => ({
        ...prev,
        fullName: modalName || prev.fullName,
        email: modalEmail || prev.email,
        phoneNumber: modalPhone || prev.phoneNumber,
      }));
      setShowAuthModal(false);
    }
  };

  const handleGoogleOAuth = async () => {
    const email = modalEmail || 'pratay.karali2005@gmail.com';
    const name = modalName || 'Pratay Karali';
    try {
      const res = await fetch('/api/v1/auth/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          google_id: `google_${Date.now()}`,
          avatar_url: '/assets/images/avatars/avatar_3_techie.svg',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthState({
          status: 'READY',
          userId: data.userId,
          displayName: data.displayName,
          email: data.email,
          avatarUrl: data.avatarUrl,
          isAuthenticated: true,
          failureReason: null,
        });
        setProfile((prev) => ({ ...prev, fullName: data.displayName, email: data.email }));
        setShowAuthModal(false);
      }
    } catch {
      setShowAuthModal(false);
    }
  };

  const handleDigiLockerOAuth = async () => {
    const phone = modalPhone || '8420773730';
    const name = modalName || profile.fullName;
    try {
      const res = await fetch('/api/v1/auth/oauth/digilocker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_number: modalAadhaar || '9876-5432-9421',
          full_name: name,
          phone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthState({
          status: 'READY',
          userId: data.userId,
          displayName: data.displayName,
          phone,
          isAuthenticated: true,
          failureReason: null,
        });
        setShowAuthModal(false);
      }
    } catch {
      setShowAuthModal(false);
    }
  };

  const currentAvatar =
    authState.avatarUrl || '/assets/images/avatars/avatar_1_student.svg';

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-6 select-none font-sans text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER WITH BACK BUTTON & ACCOUNT SWITCHER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 px-4 shadow-sm border border-purple-50 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>My Profile & Customer Database</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Persistent database isolation for tickets, <JargonHint term="citizen wallet">Citizen Wallet</JargonHint> & passenger profiles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode('SIGNUP');
              setShowAuthModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Switch / New Account</span>
          </button>

          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span><JargonHint term="DigiLocker">DigiLocker</JargonHint> Verified</span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN PROFILE CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* LEFT / CENTER: PROFILE DETAILS CARD (2 Cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-6">
          {/* Avatar Section with 10 Personas Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-4 border-b border-purple-50">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div
                  onClick={() => setShowAvatarModal(true)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-purple-300 shadow-md bg-purple-50 p-1 cursor-pointer group-hover:ring-4 group-hover:ring-purple-200 transition-all"
                >
                  <img
                    src={currentAvatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
                  title="Choose from 10 Avatars"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                    {profile.fullName}
                  </h2>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    Citizen #IN-84920
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {profile.email}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Aadhaar Verified ({profile.aadhaarNumber})</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 self-start sm:self-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Choose Avatar (10)</span>
            </button>
          </div>

          {/* Quick Avatar Strip Preview */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              10 Citizen Persona Avatars
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
              {CITIZEN_AVATARS.map((av) => {
                const isSelected = currentAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.url, av.name)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 ring-2 ring-purple-600 scale-105 shadow-sm'
                        : 'bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:scale-102'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5">
                      <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4 text-xs pt-2">
            {/* Full Name */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Full Name
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/30 text-sm"
                />
              ) : (
                <div className="text-sm font-bold text-slate-900 py-1">
                  {profile.fullName}
                </div>
              )}
            </div>

            <hr className="border-purple-50" />

            {/* Phone Number */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Phone Number
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/30 text-sm"
                />
              ) : (
                <div className="text-sm font-bold text-slate-900 py-1">
                  {profile.phoneNumber}
                </div>
              )}
            </div>

            <hr className="border-purple-50" />

            {/* Email / Gmail */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Gmail / Email ID
              </span>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/30 text-sm"
                />
              ) : (
                <div className="text-sm font-bold text-slate-900 py-1">
                  {profile.email}
                </div>
              )}
            </div>

            <hr className="border-purple-50" />

            {/* Citizen Account & IRCTC Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Citizen Account ID</span>
                <strong className="font-mono text-xs font-bold text-slate-900 block">{profile.accountNumber}</strong>
                <span className="text-[9px] text-slate-500">Universal Public Key</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Virtual Wallet Account</span>
                <strong className="font-mono text-xs font-bold text-slate-900 block">{profile.walletAccountNumber}</strong>
                <span className="text-[9px] text-emerald-700 font-semibold">Pre-funded ₹10,000 Active</span>
              </div>
            </div>

            <hr className="border-purple-50" />

            {/* 🔒 Personal Security PIN with Eye Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Personal Security PIN</span>
                    <span className="text-[10px] text-slate-500">Protects ticket cancellation & payments</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 font-mono font-black text-sm text-purple-950 shadow-2xs">
                    <span>{showPin ? (securityPin || '2026') : '••••'}</span>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-slate-400 hover:text-purple-700 cursor-pointer p-0.5"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-purple-700" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingPin(!isChangingPin)}
                    className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isChangingPin ? 'Cancel' : 'Change PIN'}
                  </button>
                </div>
              </div>

              {/* PIN Update Drawer */}
              {isChangingPin && (
                <form onSubmit={handleUpdatePin} className="pt-2 border-t border-purple-100 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Enter new 4-digit PIN"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Save PIN
                  </button>
                </form>
              )}

              {pinMessage && (
                <p className="text-[11px] font-bold text-emerald-700 animate-in fade-in">
                  {pinMessage}
                </p>
              )}
            </div>

            {/* Edit / Save CTA Button */}
            <div className="pt-3">
              {isEditing ? (
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: WALLET & SAVED PASSENGERS CARD */}
        <div className="space-y-3">
          {/* Real Wallet Balance Card */}
          <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-5 text-white shadow-md border border-purple-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                <JargonHint term="citizen wallet">Citizen Virtual Wallet</JargonHint>
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-bold px-2 py-0.2 rounded-full">
                Active Balance
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              ₹{(walletBalance || 10000).toLocaleString('en-IN')}.00
            </div>
            <p className="text-[11px] text-purple-200 font-medium">
              Government Pre-Loaded Travel Credit Grant. 100% Instant zero-PIN booking.
            </p>

            {/* Top-up CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add Balance / Top-Up Wallet</span>
              </button>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="bg-white rounded-2xl p-3 border border-purple-100 shadow-sm space-y-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => navigateTo('payments')}
              className="w-full p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-purple-700" />
              <span><JargonHint term="payment ledger">Payment Ledger & Receipts</JargonHint></span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('my-journeys')}
              className="w-full p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-700" />
              <span><JargonHint term="e-ticket">My Booked Tickets Vault</JargonHint></span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. CITIZEN AVATAR PICKER MODAL (10 PERSONAS)
          ═══════════════════════════════════════════════════════════════════ */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-purple-100 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <span>Choose Your Citizen Avatar</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    10 Personas
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select an identity style that matches your travel persona
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {CITIZEN_AVATARS.map((av) => {
                const isSelected = currentAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.url, av.name)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400 shadow-md'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100/50 p-1 shrink-0 group-hover:scale-105 transition-transform">
                      <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {av.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 block">
                        {av.badge}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {av.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. REAL OAUTH & SIGNUP / LOGIN POPUP MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {authMode === 'SIGNUP' ? 'Create Real Citizen Profile' : 'Authenticate Citizen'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Stores separate tickets, wallet & passengers in database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* OAuth Quick Connect Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleOAuth}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-xs"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Continue with Google OAuth</span>
              </button>

              <button
                type="button"
                onClick={handleDigiLockerOAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 text-xs font-bold text-blue-900 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Verify with DigiLocker / Aadhaar</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <hr className="w-full border-slate-200" />
              <span className="absolute bg-white px-2 text-[10px] font-bold text-slate-400 uppercase">
                Or Enter Details
              </span>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Ananya Roy"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {authMessage && (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 text-[11px] font-bold">
                  {authMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                {authMode === 'SIGNUP' ? 'Create Account & Switch Profile' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. TOP-UP WALLET MODAL */}
      <TopUpWalletModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
