import React, { useState } from 'react';
import {
  Sparkles,
  Train,
  ArrowRight,
  ShieldCheck,
  Search,
  Calendar,
  User,
  Mic,
  Activity,
  Layers,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Badge,
  Stepper,
  Display,
  Heading1,
  Heading2,
  Heading3,
  BodyLarge,
  Body,
  Label,
  MicroTag,
} from './index';

// Newly added components via CLI
import ShineText from '../components/smoothui/shine-text';
import TypewriterText from '../components/smoothui/typewriter-text';
import InteractiveParticles from '../components/ui/interactive-particles';
import { LightLines } from '../components/ui/light-lines';

export const DesignSystemShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(2);
  const [inputValue, setInputValue] = useState('Kolkata (HWH) to New Delhi (NDLS)');
  const [btnLoading, setBtnLoading] = useState(false);

  const journeySteps = [
    { id: '1', label: 'Search', sublabel: 'Route & Date' },
    { id: '2', label: 'Select Train', sublabel: 'Compare 4 trains' },
    { id: '3', label: 'Passengers', sublabel: 'Safe AI autofill' },
    { id: '4', label: 'Review', sublabel: 'Fare breakdown' },
    { id: '5', label: 'Payment', sublabel: 'UPI / Bridge' },
    { id: '6', label: 'Ticket', sublabel: 'Digital e-Ticket' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6FC] text-slate-900 font-sans py-10 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* HEADER SECTION */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900 to-purple-700 flex items-center justify-center text-white font-display font-black text-2xl shadow-lg shadow-purple-900/25">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl tracking-tight text-purple-950">
                  NIRANTAR
                </span>
                <Badge variant="accent" size="sm" dot>
                  Design System v1.1
                </Badge>
              </div>
              <p className="text-sm font-medium text-purple-800/80">
                “Your journey, simplified.” — Citizen-first Railway Design System
              </p>
            </div>
          </div>

          {/* HERO WITH LIGHT-LINES & SHINE-TEXT */}
          <div className="relative rounded-3xl lg:rounded-4xl overflow-hidden border border-purple-200/80 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white shadow-[0_15px_40px_rgba(88,28,135,0.2)]">
            <LightLines
              linesOpacity={0.12}
              lightsOpacity={0.8}
              gradientFrom="#7E22CE"
              gradientTo="#F59E0B"
              lightColor="#FEF3C7"
              lineColor="#DDD6FE"
              className="p-8 lg:p-12"
            >
              <div className="space-y-4 max-w-3xl relative z-10">
                <Badge variant="accent" size="md" icon={<Sparkles className="w-4 h-4 text-amber-900" />}>
                  <ShineText baseColor="#78350F" shineColor="#FFFFFF" duration={2}>
                    Next-Gen Motion & Typography Added
                  </ShineText>
                </Badge>

                <Display as="h1" className="text-white">
                  <ShineText baseColor="#FAF5FF" shineColor="#FDE68A" duration={3}>
                    Citizen-First Railway Design Tokens
                  </ShineText>
                </Display>

                <div className="text-purple-200 text-lg font-medium flex items-center gap-2">
                  <span>Natural query:</span>
                  <span className="text-amber-300 font-bold font-mono bg-purple-900/60 px-3 py-1 rounded-xl border border-purple-500/30">
                    <TypewriterText loop speed={40}>
                      "Find fastest train from Delhi to Kolkata tomorrow for 2 passengers"
                    </TypewriterText>
                  </span>
                </div>

                <BodyLarge className="text-purple-200/90 pt-2">
                  Built specifically for Indian railway passengers. Focused on clarity, accessible large touch targets,
                  calming royal purple and lavender hues with warm golden accents, and frictionless continuous navigation.
                </BodyLarge>
              </div>
            </LightLines>
          </div>
        </header>

        {/* MOTION & ADVANCED UI SHOWCASE */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3 flex items-center justify-between">
            <div>
              <MicroTag>Installed Motion Components</MicroTag>
              <Heading1 className="mt-1 text-purple-950">SmoothUI & VengenceUI Components</Heading1>
            </div>
            <Badge variant="secondary" icon={<Activity className="w-3.5 h-3.5" />}>
              4 Components Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Shine Text Card */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading3 className="text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Shine Text (`smoothui`)
                </Heading3>
                <Badge variant="secondary" size="sm">shine-text</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Sweeping gradient shimmer highlight for emphasized railway titles and ticket confirmations.
              </p>
              <div className="p-6 rounded-2xl bg-purple-950 text-center flex flex-col items-center justify-center min-h-[120px]">
                <h2 className="text-2xl font-black font-display tracking-tight">
                  <ShineText baseColor="#DDD6FE" shineColor="#FBBF24" duration={2.5}>
                    Vande Bharat Express (22436)
                  </ShineText>
                </h2>
                <p className="text-xs text-purple-300 font-mono mt-2">
                  <ShineText baseColor="#A78BFA" shineColor="#FFFFFF" duration={2}>
                    CONFIRMED SEATS AVAILABLE • TATKAL
                  </ShineText>
                </p>
              </div>
            </Card>

            {/* 2. Typewriter Text Card */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading3 className="text-purple-950 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-700" /> Typewriter Text (`smoothui`)
                </Heading3>
                <Badge variant="secondary" size="sm">typewriter-text</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Simulates real-time voice and natural language intent extraction in the search bar.
              </p>
              <div className="p-5 rounded-2xl bg-white border-2 border-purple-100 flex items-center gap-3 min-h-[120px]">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-purple-700 uppercase">Live Voice Query:</span>
                  <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                    <TypewriterText loop speed={45}>
                      "I need an AC 3-Tier ticket to Mumbai on Friday with senior citizen berth"
                    </TypewriterText>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Light Lines Background */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading3 className="text-purple-950 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-700" /> Light Lines (`vengenceui`)
                </Heading3>
                <Badge variant="secondary" size="sm">light-lines</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Curved optical railway track lines with animated light pulses for background visual depth.
              </p>
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-purple-900/50">
                <LightLines
                  linesOpacity={0.2}
                  lightsOpacity={0.9}
                  gradientFrom="#6B21A8"
                  gradientTo="#F59E0B"
                  lightColor="#FDE68A"
                  lineColor="#DDD6FE"
                  className="h-full flex items-center justify-center p-4 text-center"
                >
                  <div className="relative z-10 text-white space-y-1">
                    <h4 className="font-display font-black text-lg">High-Speed Railway Corridor</h4>
                    <p className="text-xs text-purple-200">Track telemetry & route progression</p>
                  </div>
                </LightLines>
              </div>
            </Card>

            {/* 4. Interactive Particles Background */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading3 className="text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Interactive Particles (`vengenceui`)
                </Heading3>
                <Badge variant="secondary" size="sm">interactive-particles</Badge>
              </div>
              <p className="text-xs text-slate-500">
                WebGL GPU particles responding to cursor movement for interactive state transitions.
              </p>
              <div className="relative h-44 rounded-2xl overflow-hidden bg-[#0A071B] border border-purple-900/50">
                <InteractiveParticles
                  color="#DDD6FE" background="#0A071B" allowUpload={false}
                  
                  
                  className="h-full w-full"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold backdrop-blur-sm">
                    Move cursor over particles
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 1. COLOR PALETTE */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 01</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Color Palette</Heading1>
            <Body className="text-slate-600">
              Harmonious, trustworthy, and non-overwhelming color scale with high contrast ratios.
            </Body>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary: Royal Purple */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading3 className="text-purple-950">Primary: Royal Purple</Heading3>
                  <p className="text-xs text-slate-500 font-medium">Main brand identity & primary actions</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#6B21A8] shadow-md shadow-purple-900/30" />
              </div>

              <div className="space-y-2">
                <div className="h-14 rounded-2xl bg-[#6B21A8] text-white flex items-center justify-between px-4 font-mono text-xs font-bold shadow-sm">
                  <span>Royal Purple 800 (Main)</span>
                  <span>#6B21A8</span>
                </div>
                <div className="h-10 rounded-xl bg-[#581C87] text-white flex items-center justify-between px-4 font-mono text-xs">
                  <span>Royal Purple 900 (Deep)</span>
                  <span>#581C87</span>
                </div>
                <div className="h-10 rounded-xl bg-[#7E22CE] text-white flex items-center justify-between px-4 font-mono text-xs">
                  <span>Royal Purple 700</span>
                  <span>#7E22CE</span>
                </div>
                <div className="h-10 rounded-xl bg-[#FAF5FF] text-purple-950 border border-purple-200 flex items-center justify-between px-4 font-mono text-xs">
                  <span>Royal Purple 50 (Tint)</span>
                  <span>#FAF5FF</span>
                </div>
              </div>
            </Card>

            {/* Secondary: Lavender */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading3 className="text-purple-950">Secondary: Lavender</Heading3>
                  <p className="text-xs text-slate-500 font-medium">Soft card backgrounds, chips, and borders</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#DDD6FE] shadow-sm" />
              </div>

              <div className="space-y-2">
                <div className="h-14 rounded-2xl bg-[#EDE9FE] text-purple-950 border border-purple-200 flex items-center justify-between px-4 font-mono text-xs font-bold shadow-sm">
                  <span>Lavender 200 (Card Soft)</span>
                  <span>#EDE9FE</span>
                </div>
                <div className="h-10 rounded-xl bg-[#DDD6FE] text-purple-950 flex items-center justify-between px-4 font-mono text-xs">
                  <span>Lavender 300 (Border)</span>
                  <span>#DDD6FE</span>
                </div>
                <div className="h-10 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-between px-4 font-mono text-xs">
                  <span>Lavender 600 (Icon Accent)</span>
                  <span>#8B5CF6</span>
                </div>
                <div className="h-10 rounded-xl bg-[#FBF9FF] text-purple-950 border border-purple-100 flex items-center justify-between px-4 font-mono text-xs">
                  <span>Lavender 50 (Canvas)</span>
                  <span>#FBF9FF</span>
                </div>
              </div>
            </Card>

            {/* Accent: Warm Golden Yellow */}
            <Card variant="standard" padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading3 className="text-purple-950">Accent: Warm Gold</Heading3>
                  <p className="text-xs text-slate-500 font-medium">Recommendations, highlights, and CTA stars</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] shadow-md shadow-amber-500/30" />
              </div>

              <div className="space-y-2">
                <div className="h-14 rounded-2xl bg-[#F59E0B] text-slate-950 flex items-center justify-between px-4 font-mono text-xs font-bold shadow-sm">
                  <span>Warm Gold 500 (Main)</span>
                  <span>#F59E0B</span>
                </div>
                <div className="h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-between px-4 font-mono text-xs">
                  <span>Warm Gold 600</span>
                  <span>#D97706</span>
                </div>
                <div className="h-10 rounded-xl bg-[#FEF3C7] text-amber-950 border border-amber-300 flex items-center justify-between px-4 font-mono text-xs">
                  <span>Warm Gold 100 (Badge Pill)</span>
                  <span>#FEF3C7</span>
                </div>
                <div className="h-10 rounded-xl bg-[#FFFBEB] text-amber-900 border border-amber-200 flex items-center justify-between px-4 font-mono text-xs">
                  <span>Warm Gold 50 (Highlight)</span>
                  <span>#FFFBEB</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 2. TYPOGRAPHY SCALE */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 02</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Typography Scale</Heading1>
            <Body className="text-slate-600">
              Legible, high-contrast, modern Indian typography with zero microscopic text.
            </Body>
          </div>

          <Card variant="standard" padding="lg" className="space-y-6">
            <div className="space-y-4 divide-y divide-purple-100">
              <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Display (48px / Bold)</span>
                <Display>Let's plan your next journey</Display>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Heading 1 (30px / Extrabold)</span>
                <Heading1>Discover & Compare Suitable Trains</Heading1>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Heading 2 (24px / Bold)</span>
                <Heading2>Vande Bharat Superfast Express (22436)</Heading2>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Heading 3 (20px / Bold)</span>
                <Heading3>Select Passenger Details & Berth Preference</Heading3>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Body Large (16px / Medium)</span>
                <BodyLarge>
                  Nirantar guarantees safe field autofill while keeping passwords, OTPs, and payment PINs strictly in citizen control.
                </BodyLarge>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Body (14px / Regular)</span>
                <Body>
                  Boarding Station: Howrah Junction (HWH) • Destination: New Delhi (NDLS) • Platform No. 8
                </Body>
              </div>

              <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-purple-700 font-bold w-48 shrink-0">Micro Tag (12px / Monospace)</span>
                <MicroTag>PNR 842-9104821 • DIGILOCKER VERIFIED</MicroTag>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. BUTTONS & ACTIONS */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 03</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Button Variants & Sizes</Heading1>
            <Body className="text-slate-600">
              Large, accessible touch targets (min 44px) with clear focus indicators and micro-interactions.
            </Body>
          </div>

          <Card variant="standard" padding="lg" className="space-y-8">
            {/* Variants */}
            <div className="space-y-3">
              <Label className="text-slate-500 font-mono uppercase">Variants</Label>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Primary Button
                </Button>
                <Button variant="accent" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Accent Highlight
                </Button>
                <Button variant="secondary" leftIcon={<ShieldCheck className="w-4 h-4" />}>
                  Secondary Lavender
                </Button>
                <Button variant="outline">
                  Outline Neutral
                </Button>
                <Button variant="ghost">
                  Ghost Action
                </Button>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                >
                  Click to Test Loading
                </Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <Label className="text-slate-500 font-mono uppercase">Sizes</Label>
              <div className="flex flex-wrap gap-4 items-center">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Large CTA (52px)
                </Button>
                <Button size="md" variant="primary">
                  Medium Standard (44px)
                </Button>
                <Button size="sm" variant="secondary">
                  Small Chip (36px)
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. CARD STYLES & SOFT SHADOWS */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 04</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Card Variants & Elevation</Heading1>
            <Body className="text-slate-600">
              Soft lavender ambient shadows, rounded corners, and crisp border contrast.
            </Body>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="standard" padding="md" className="space-y-3">
              <Badge variant="secondary">Standard Card</Badge>
              <Heading3>White Canvas Card</Heading3>
              <Body className="text-slate-600 text-sm">
                Default surface for lists, train details, and passenger review steps.
              </Body>
            </Card>

            <Card variant="interactive" padding="md" className="space-y-3">
              <Badge variant="primary">Interactive Card</Badge>
              <Heading3>Hoverable Train Card</Heading3>
              <Body className="text-slate-600 text-sm">
                Elevates smoothly with purple glow on hover for selectable items.
              </Body>
            </Card>

            <Card variant="highlight" padding="md" className="space-y-3">
              <Badge variant="accent" dot>Recommended</Badge>
              <Heading3>Best Overall Train</Heading3>
              <Body className="text-slate-700 text-sm">
                Warm gold border highlighting fastest or most cost-effective routes.
              </Body>
            </Card>
          </div>
        </section>

        {/* 5. FORM INPUTS & SEARCH CONTROLS */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 05</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Readable Form Inputs</Heading1>
            <Body className="text-slate-600">
              Large readable fields (16px text) preventing zoom issues, with instant helper and error feedback.
            </Body>
          </div>

          <Card variant="standard" padding="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Journey Route (Natural Language or Stations)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                leftIcon={<Train className="w-5 h-5 text-purple-700" />}
                rightIcon={<Mic className="w-5 h-5 text-purple-600 cursor-pointer hover:text-purple-800" />}
                helperText="Try typing: 'Delhi to Mumbai tomorrow evening for 2 people'"
              />

              <Input
                label="Passenger Full Name"
                placeholder="e.g. Pratay Karali"
                defaultValue="Pratay Karali"
                leftIcon={<User className="w-5 h-5 text-purple-700" />}
                helperText="Protected by 1-click safe AI autofill"
              />

              <Input
                label="Journey Date"
                type="date"
                defaultValue="2026-08-24"
                leftIcon={<Calendar className="w-5 h-5 text-purple-700" />}
              />

              <Input
                label="PNR Number Tracker"
                placeholder="Enter 10-digit PNR"
                defaultValue="8429104821"
                leftIcon={<Search className="w-5 h-5 text-purple-700" />}
                helperText="Live chart status & coach berth telemetry"
              />
            </div>
          </Card>
        </section>

        {/* 6. CONTINUOUS JOURNEY STEPPER */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 06</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Continuous Journey Stepper</Heading1>
            <Body className="text-slate-600">
              Guiding citizens through the 6-stage continuous experience without confusing redirects.
            </Body>
          </div>

          <div className="space-y-4">
            <Stepper
              steps={journeySteps}
              currentStepIndex={activeStep}
              onSelectStep={(idx) => setActiveStep(idx)}
            />

            <div className="flex items-center justify-between px-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              >
                ← Previous Stage
              </Button>
              <span className="text-xs font-mono text-purple-800 font-bold">
                Stage {activeStep + 1} of {journeySteps.length}: {journeySteps[activeStep].label}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={activeStep === journeySteps.length - 1}
                onClick={() => setActiveStep((prev) => Math.min(journeySteps.length - 1, prev + 1))}
              >
                Next Stage →
              </Button>
            </div>
          </div>
        </section>

        {/* 7. BADGES & CITIZEN SAFETY PILLS */}
        <section className="space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <MicroTag>Token Group 07</MicroTag>
            <Heading1 className="mt-1 text-purple-950">Badges & Safety Guarantees</Heading1>
            <Body className="text-slate-600">
              Clear visual tags for seat availability, quotas, and AI boundary transparency.
            </Body>
          </div>

          <Card variant="standard" padding="lg" className="space-y-6">
            <div className="space-y-3">
              <Label className="text-slate-500 font-mono uppercase">Seat & Quota Badges</Label>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" dot>Available (48 Seats)</Badge>
                <Badge variant="warning" dot>RAC 12</Badge>
                <Badge variant="error" dot>WL 45</Badge>
                <Badge variant="primary">General Quota (GN)</Badge>
                <Badge variant="accent">Tatkal Quota (TQ)</Badge>
                <Badge variant="secondary">Ladies Quota (LD)</Badge>
                <Badge variant="neutral">Senior Citizen (SS)</Badge>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-purple-950">AI Security Boundary Guaranteed</h4>
                  <p className="text-xs text-slate-600">
                    Nira assists with non-sensitive fields only. Passwords, OTPs, and payment PINs are never handled by AI.
                  </p>
                </div>
              </div>
              <Badge variant="accent" size="sm">
                100% Safe
              </Badge>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
