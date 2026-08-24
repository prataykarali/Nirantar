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
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export const ProfilePage: React.FC = () => {
  const { navigateTo } = useJourney();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'Rahul Sharma',
    phoneNumber: '+91 98765 43210',
    email: 'rahul.sharma@email.com',
    dob: '12 Jan 1998',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-6 select-none font-sans text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER WITH BACK BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 px-4 shadow-sm border border-purple-50">
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
              <span>My Profile</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Manage your personal information and verified citizen ID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Citizen</span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN PROFILE CARD MATCHING REFERENCE IMAGE 1
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* LEFT / CENTER: PROFILE DETAILS CARD (2 Cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-5 pb-4 border-b border-purple-50">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-purple-300 shadow-md bg-purple-50">
                <img
                  src="/assets/images/user_avatar.png"
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
                title="Edit avatar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {profile.fullName}
                </h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Citizen #IN-84920
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {profile.email}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Aadhaar Verified (XXXX-XXXX-9421)</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4 text-xs">
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

            {/* Email */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Email
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

            {/* Date of Birth */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Date of Birth
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/30 text-sm"
                />
              ) : (
                <div className="text-sm font-bold text-slate-900 py-1">
                  {profile.dob}
                </div>
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

        {/* RIGHT COLUMN: MASCOT ASSISTANT & QUICK NAVIGATION */}
        <div className="space-y-3">
          {/* Mascot & Nira Card */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-3xl p-5 border border-purple-100 shadow-sm text-center space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Nira SafeProfile</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Encrypted
              </span>
            </div>

            {/* Mascot Image */}
            <div className="w-24 h-24 mx-auto flex items-center justify-center pointer-events-none">
              <img
                src="/assets/images/characters/citizen_thumbsup.png"
                alt="Citizen Mascot"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div className="bg-white rounded-2xl p-3 shadow-xs border border-purple-100 text-left space-y-1 text-xs">
              <span className="font-bold text-purple-950 block">Instant Autofill Active</span>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Your profile information is stored on your local device and securely autofilled when booking trains.
              </p>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="bg-white rounded-2xl p-3 border border-purple-100 shadow-sm space-y-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="w-full p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4 text-purple-700" />
              <span>My Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('help')}
              className="w-full p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Privacy & Security</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
