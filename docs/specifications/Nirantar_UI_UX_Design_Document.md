NIRANTAR
UI / UX DESIGN SPECIFICATION
Citizen-first IRCTC Journey Experience
Design System v1.0 • Premium, accessible, guided, continuous


# 1. Design Vision
Nirantar should feel less like a government portal and more like a calm journey companion. The visual layer may be premium and playful, including soft 3D illustrations and Nira, but the interaction model must remain highly functional. Visual polish exists to reduce cognitive load, not to decorate a complicated workflow.
Design statement: 
“One journey. One place. Clear next step.”
# 2. UX Principles

# 3. Target Users

# 4. Information Architecture
GLOBAL NAVIGATION
├── Home
├── Discover
├── My Journeys
├── Track
├── Payments
├── Help Center
└── Notifications

PRIMARY CITIZEN JOURNEY
Home
  ↓
Discover
  ↓
Train Results
  ↓
Journey / Booking
  ↓
Review + Safe Autofill
  ↓
Payment
  ↓
Journey Tracker
  ↓
Ticket / Completion

GLOBAL OVERLAY
Nira contextual assistant
# 5. Page-by-Page UX Specification
## 5.1 Home
Primary purpose: start a journey immediately.
Hero interaction: “Where do you want to go?” with text and voice input.
Secondary actions: recent journeys, saved preferences and quick discovery.
Visual hierarchy: large journey prompt → suggested journeys → recent activity.
Nira appears as a small optional assistant bubble, not a full-screen chatbot.
Primary CTA must be visually dominant.
## 5.2 Discover
Accept typed or speech input.
Show a compact interpreted-intent card before search.
Example: “Delhi → Mumbai • Tomorrow • Evening • 2 passengers.”
User can edit any extracted value without restarting.
Ambiguity should produce one focused clarification rather than a long questionnaire.
## 5.3 Train Results
Show a clear comparison rather than a dense table.
Recommended categories: Best overall, Cheapest, Fastest.
Each train card shows only decision-critical information first.
Expandable details reveal schedule, duration, class and fare information.
Nira can explain why a result was recommended.
No fabricated availability or fare information.
## 5.4 Journey / Booking
Display journey progress at the top.
Separate passenger details from train details.
Use large, clearly labelled fields.
Show contextual Nira guidance when a field is confusing.
Do not ask the user to paste passwords, OTPs or banking secrets into chat.
Sticky “Continue” action on mobile.
## 5.5 Review + Safe Autofill
Show exactly which fields Nira prepared.
Use a simple before/after confirmation pattern.
Sensitive fields are explicitly outside AI assistance.
Primary CTA: “Confirm details”.
Secondary CTA: “Edit myself”.
Make the boundary visible without frightening the user.
## 5.6 Payment
Show total amount and selected journey clearly before payment.
Offer clear mock payment methods: UPI, Card, Net Banking.
Nira may explain or point to an option.
Secure payment/auth components remain separate from the chat.
Payment state is always visible.
If UNKNOWN/PROCESSING occurs, the recovery action dominates the screen.
## 5.7 Journey Tracker
Show the current state using a visual timeline.
Examples: Application → Details → Payment → Confirmed.
Show meaningful status rather than technical backend terminology.
Allow the user to reopen the journey without losing context.
Nira can answer contextual tracking questions.
## 5.8 Ticket / Completion
Celebrate completion without obscuring important ticket information.
Show synthetic booking/ticket reference clearly.
Primary actions: view, save/download mock ticket, share, start another journey.
Include a concise journey summary.
Feedback should be optional and lightweight.
# 6. Nira UX Specification
Nira is a contextual assistant, not the website itself. It should feel like a small intelligent companion that opens only when useful.

## 6.1 Nira Overlay Layout
┌──────────────────────────────────────────────┐
│                 NIRANTAR PAGE                │
│                                              │
│                              ┌─────────────┐ │
│                              │ Nira     ×  │ │
│                              │             │ │
│                              │ “I found   │ │
│                              │  3 good    │ │
│                              │  options.” │ │
│                              │             │ │
│                              │ [Show me]  │ │
│                              └─────────────┘ │
│                                      ◉ Nira  │
└──────────────────────────────────────────────┘
The overlay should occupy a small fraction of the screen. It must never turn every page into a chatbot interface.
# 7. Banking & Authentication UX
## 7.1 Authentication
Authentication appears as a dedicated secure surface.
Nira may explain what the user needs to do but does not collect credentials.
Password and OTP fields visually communicate secure entry.
Never present a chat input as an alternative place to enter credentials.
Successful authentication returns the user to the exact previous journey step.
## 7.2 Banking Guidance
Payment options should be presented as clear cards with concise descriptions.
Nira may point to “UPI”, “Card” or “Net Banking” using a visual focus indicator.
Bank-style authentication is visually separated from Nira.
The user always sees how to return to the Nirantar journey.
The UI must never imply that Nirantar can bypass bank security or redirects.
## 7.3 Payment Recovery UX

For UNKNOWN, the primary visual action must be status verification. A second payment button should not be the dominant action.
# 8. Visual Design System
## 8.1 Color Strategy
Use a restrained three-color foundation with controlled accents. The product can be visually rich without becoming noisy.

## 8.2 Typography

## 8.3 Spacing & Layout
Use an 8px spacing system.
Desktop content should use a wide but controlled max-width.
Persistent left navigation may be used on desktop.
Mobile navigation should collapse to a bottom navigation or compact drawer.
Primary actions should have generous touch targets.
Avoid dense multi-column forms.
# 9. Components

# 10. Interaction & Motion Design
Animation should communicate state and direction. It should not create visual noise.

# 11. 3D / Pixar-inspired Visual Language
The visual direction may use friendly 3D character art inspired by high-quality animated-film aesthetics, but UI clarity remains the priority.
Nira is the primary 3D character and visual brand asset.
A friendly citizen character can appear in hero/celebration moments.
3D illustrations should occupy large visual areas only where they support orientation or emotional payoff.
Do not place 3D objects behind dense form controls.
Keep core UI surfaces flat enough for readability.
Use glow, depth and soft shadows selectively.
# 12. Responsive Design

# 13. Accessibility
WCAG-oriented contrast for text and controls.
Keyboard navigation for all core flows.
Visible focus indicators.
Labels associated with form inputs.
Icons paired with text where meaning is important.
Color must not be the sole indicator of success, failure or payment state.
Voice input should have a text fallback.
Animations should respect reduced-motion preferences.
Error messages should explain what happened and how to recover.
# 14. AI UX Safety Patterns

# 15. UX Copy Guidelines

# 16. UX States & Edge Cases

# 17. Usability Metrics

# 18. UX Testing Plan
Give a first-time reviewer a natural journey request without explaining the UI.
Measure whether they understand the interpreted intent.
Observe train comparison and selection behavior.
Test safe autofill and whether the AI/data boundary is understood.
Trigger payment SUCCESS, FAILED and UNKNOWN states.
Test authentication expiry and return-to-journey behavior.
Trigger a synthetic high-traffic queue state.
Repeat the journey on mobile width.
Collect confusion points and remove UI elements that do not help the primary task.
# 19. Design-to-Engineering Handoff
DESIGN TOKENS
   ↓
COMPONENT LIBRARY
   ↓
PAGE COMPOSITIONS
   ↓
JOURNEY STATE
   ↓
API CONTRACTS
   ↓
INTERACTION STATES
   ↓
TEST CASES
Every component should define default, hover, focus, loading, success, error and disabled states where applicable.
Every page should specify its primary CTA and its recovery CTA.
Every AI interaction should specify the fallback behavior.
Every payment interaction should specify its state-machine mapping.
Figma/Canva designs should map directly to reusable frontend components.
# 20. Final UX Architecture
                 NIRANTAR EXPERIENCE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     DISCOVER          DECIDE           COMPLETE
        │                │                │
   voice/text       compare trains    payment
   intent           explain choice    recovery
        │                │                │
        └────────────────┼────────────────┘
                         │
                    NIRA OVERLAY
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       GUIDE          PREPARE         EXPLAIN
          │              │              │
       UI focus      safe autofill   context/help
          │              │              │
          └──────────────┼──────────────┘
                         │
                SECURE BOUNDARIES
                 /               \
          AUTHENTICATION       PAYMENT
           secrets             secrets
             │                    │
             └──────────┬─────────┘
                        │
                 DETERMINISTIC
                   SERVICES
# 21. Design Success Criteria
A new user can understand the primary task within seconds.
The user always knows what the next action is.
Nira feels like assistance rather than another website to operate.
The UI is visually premium without becoming cluttered.
The complete journey can be demonstrated from Home to ticket.
Authentication and banking are visually and technically separated from the AI layer.
The payment UNKNOWN state is impossible to misunderstand.
The design works on desktop and mobile.
Accessibility is built into the interaction model.
The visual system is distinctive enough to be memorable but restrained enough to feel trustworthy.
# Appendix A — Core Visual Direction
Recommended visual formula: deep indigo base + violet interaction layer + warm gold accent + soft neutral surfaces, with selective 3D character moments. Use large visual anchors, short copy, clear cards and strong alignment.
# Appendix B — Product UX Mantra
SEE IT. UNDERSTAND IT. DO IT. CONTINUE.
| Field | Value |
| Product | Nirantar |
| Primary User | Indian railway passenger / citizen |
| Primary Goal | Complete a railway journey with less confusion, navigation friction and payment uncertainty. |
| Design Character | Premium, warm, visual, trustworthy, simple. |
| Core Interaction | One continuous journey with contextual Nira assistance. |
| Prototype | IRCTC-focused, synthetic/mock data, independent prototype. |
| Principle | What It Means in Nirantar |
| One journey | The user always knows where they are in the booking journey. |
| Next action first | The UI emphasizes what the user should do now, not every possible option. |
| Explain, don't overwhelm | Nira explains complex choices in concise language. |
| AI with boundaries | Nira guides and prepares; secure components handle credentials and payment secrets. |
| No dead ends | Every failure state provides a clear recovery path. |
| No blind payment retry | UNKNOWN payment status leads to verification, not a second payment. |
| Visual guidance | Arrows, focus states and contextual highlights show where to act. |
| Progressive disclosure | Advanced details stay available without dominating the first view. |
| Indian-first | Dates, currencies, names, travel patterns and language should feel familiar to Indian users. |
| Accessible by default | Readable type, keyboard support, contrast, labels and non-color status cues. |
| User | Pain Point | UX Response |
| First-time digital traveller | Does not know which option to choose. | Guided comparison + contextual Nira. |
| Frequent traveller | Wants speed and fewer repetitive steps. | Saved preferences + safe autofill. |
| Low-confidence digital user | Gets lost across complex forms. | Single next-step CTA + visual guidance. |
| Payment-anxious user | Fear of paying twice after failure. | Explicit payment state + verification flow. |
| Mobile-first user | Limited screen space and attention. | Compact cards, sticky action and responsive layout. |
| State | Behavior |
| Closed | Small Nira icon/bubble remains available. |
| Hint | Short contextual suggestion appears near the relevant control. |
| Open | Compact floating panel appears on the right side on desktop and bottom sheet on mobile. |
| Guiding | Nira highlights the target UI element and gives one concise instruction. |
| Waiting | Nira shows a subtle processing state without blocking the page. |
| Error | Nira explains what failed and provides a deterministic alternative. |
| Sensitive step | Nira explicitly hands control to the secure UI. |
| State | Headline | Primary Action |
| Processing | Payment is being confirmed | Wait / Check status |
| Success | Payment confirmed | Continue to ticket |
| Failed | Payment wasn't completed | Try again |
| Unknown | We need to check your payment | Check payment status |
| Role | Recommended Direction |
| Primary | Deep indigo / midnight purple for navigation, text and core surfaces. |
| Secondary | Electric violet / premium purple for active states and AI interactions. |
| Accent | Warm gold/yellow for success, celebration and selected highlights. |
| Neutral | White / soft lavender-gray backgrounds and surfaces. |
| Status | Use semantic green, amber and red sparingly and never as the only status signal. |
| Use | Guideline |
| Display | Friendly geometric sans-serif; bold, short headings. |
| Body | Highly readable sans-serif with generous line-height. |
| Numbers | High legibility for fare, time and ticket identifiers. |
| Labels | Short, explicit and action-oriented. |
| Tone | Plain English; avoid unnecessary government/technical jargon. |
| Component | Purpose |
| Journey Stepper | Shows where the citizen is in the journey. |
| Nira Bubble | Entry point to contextual AI assistance. |
| Nira Panel | Compact right-side AI overlay. |
| Journey Search | Primary destination/date/passenger input. |
| Train Card | Decision-oriented train comparison. |
| Recommendation Badge | Best overall / fastest / cheapest. |
| Guided Focus Ring | Shows the exact UI element Nira references. |
| Autofill Review Card | Shows AI-prepared safe fields. |
| Payment Method Card | Clear payment option selection. |
| Payment State Banner | Makes payment state unambiguous. |
| Status Timeline | Visual journey tracking. |
| Ticket Card | Final synthetic ticket representation. |
| Toast / Alert | Non-blocking feedback. |
| Modal | Only for high-attention confirmations. |
| Interaction | Motion |
| Page transition | Short fade/slide. |
| Nira opens | Soft scale + fade from its bubble. |
| Guided element | Brief focus pulse, then stable highlight. |
| Journey progress | Smooth progress movement between steps. |
| Payment success | Short celebratory animation. |
| Error | Subtle shake or state transition, not aggressive animation. |
| Loading | Skeletons or compact progress indicators. |
| 3D character | Small idle animation; avoid distracting loops. |
| Breakpoint | UX Strategy |
| Desktop | Persistent sidebar + wide content + right-side Nira overlay. |
| Tablet | Collapsible navigation + adaptable two-column content. |
| Mobile | Single-column flow + sticky primary CTA + bottom-sheet Nira. |
| Small mobile | Prioritize next action, selected train, payment state and journey progress. |
| Risk | UI Pattern |
| Hallucinated recommendation | Show structured source/result details and distinguish recommendation from fact. |
| Unexpected AI action | Show action confirmation before consequential operations. |
| Credential request | Block and redirect to secure authentication component. |
| Payment manipulation | Nira cannot initiate or alter payment secrets. |
| Over-automation | Provide Edit / Cancel controls. |
| Ambiguous intent | Ask one clarification rather than guessing. |
| AI unavailable | Fallback to deterministic search/navigation. |
| Avoid | Prefer |
| “Invalid transaction state detected.” | “We’re checking whether your payment went through.” |
| “Execute action.” | “Continue to payment.” |
| “Authentication failure.” | “Your sign-in details didn’t work. Try again.” |
| “LLM confidence 0.71.” | “I’m not sure which date you meant.” |
| “System overloaded.” | “It’s busy right now. We’re keeping your place in line.” |
| Scenario | Expected Experience |
| No trains found | Suggest changing date/time/filter; do not show a blank page. |
| Ambiguous destination | Ask a concise clarification. |
| AI unavailable | Continue with manual search. |
| Autofill rejected | Keep original fields unchanged. |
| Payment processing | Show waiting state and preserve journey. |
| Payment unknown | Verification-first recovery. |
| Session expired | Explain and return user to the same journey step after re-auth. |
| Network interruption | Preserve local draft where safe and allow retry. |
| High traffic | Explain queue/rate state without exposing infrastructure details. |
| Metric | Target for Prototype Testing |
| Time to first search | Under 30 seconds for a first-time reviewer. |
| Intent correction | User can correct an extracted field without restarting. |
| Train selection | User can explain why they selected a train. |
| Payment recovery | User understands not to pay twice in UNKNOWN state. |
| Navigation | Reviewer can complete core flow without external instructions. |
| AI transparency | Reviewer understands what Nira did and did not access. |
| Error recovery | Every tested failure state has an obvious next action. |