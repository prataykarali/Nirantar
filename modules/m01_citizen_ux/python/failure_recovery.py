"""
NIRANTAR Module 1 — Citizen Failure Recovery & Exception Explainer
==================================================================
Translates raw backend failure modes (502 Bad Gateway, Timeout, Lock Drops)
into human-understandable, actionable recovery steps with inventory hold preservation.
"""

from typing import Any, Dict, Optional


class FailureRecoveryEngine:
    """Interprets transaction drops and provides 1-click retry flows."""

    RECOVERY_KNOWLEDGE_BASE = {
        "PAYMENT_TIMEOUT": {
            "en": {
                "title": "Payment Verification Delayed",
                "explanation": "Your bank took longer than usual to respond. Your money has not been debited.",
                "action": "Your seat reservation is locked for 4 more minutes. Click 'Retry Payment' to complete with UPI.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 240,
            },
            "hi": {
                "title": "भुगतान सत्यापन में देरी",
                "explanation": "आपके बैंक से उत्तर मिलने में सामान्य से अधिक समय लगा। आपके पैसे नहीं कटे हैं।",
                "action": "आपकी सीट 4 मिनट के लिए सुरक्षित है। UPI से पुनः प्रयास करने के लिए नीचे क्लिक करें।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 240,
            },
            "bn": {
                "title": "পেমেন্ট যাচাইকরণে বিলম্ব",
                "explanation": "আপনার ব্যাংক থেকে প্রতিক্রিয়া পেতে অতিরিক্ত সময় লেগেছে। আপনার টাকা কাটা হয়নি।",
                "action": "আপনার আসনটি ৪ মিনিটের জন্য সংরক্ষিত রয়েছে। UPI দিয়ে পুনরায় চেষ্টা করতে ক্লিক করুন।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 240,
            },
            "ta": {
                "title": "பணம் செலுத்தல் சரிபார்ப்பு தாமதமானது",
                "explanation": "உங்கள் வங்கியிலிருந்து பதில் பெற கூடுதல் நேரமானது. உங்கள் பணம் பிடிக்கப்படவில்லை.",
                "action": "உங்கள் இருக்கை 4 நிமிடங்கள் பாதுகாப்பாக உள்ளது. மீண்டும் முயற்சிக்கவும்.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 240,
            },
        },
        "PAYMENT_UNKNOWN": {
            "en": {
                "title": "Payment Verification Pending",
                "explanation": "We sent a request to your payment provider, but status is currently unconfirmed.",
                "action": "Your seat lock is preserved for 5 minutes. Please do not submit a duplicate payment.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 300,
            },
            "hi": {
                "title": "भुगतान स्थिति अनिर्णीत",
                "explanation": "आपके भुगतान प्रदाता से स्थिति अभी तक पुष्टि नहीं हुई है।",
                "action": "आपकी सीट 5 मिनट के लिए सुरक्षित है। कृपया दोबारा भुगतान न करें।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 300,
            },
            "bn": {
                "title": "পেমেন্ট স্ট্যাটাস পেন্ডিং",
                "explanation": "আপনার পেমেন্ট গেটওয়ে থেকে স্থিতি নিশ্চিত হওয়া বাকি।",
                "action": "আপনার আসন ৫ মিনিটের জন্য সংরক্ষিত আছে। পুনরায় পেমেন্ট করবেন না।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 300,
            },
            "ta": {
                "title": "பணம் செலுத்தல் நிலை நிலுவையில் உள்ளது",
                "explanation": "பணம் செலுத்தும் சேவை வழங்குநரிடமிருந்து தகவல் இன்னும் உறுதி செய்யப்படவில்லை.",
                "action": "உங்கள் இருக்கை 5 நிமிடங்களுக்கு பாதுகாக்கப்பட்டுள்ளது. மீண்டும் பணம் செலுத்த வேண்டாம்.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 300,
            },
        },
        "SEAT_HOLD_EXPIRED": {
            "en": {
                "title": "Seat Reservation Hold Expired",
                "explanation": "Your temporary 4-minute seat hold timed out while completing payment.",
                "action": "Re-select your preferred train to obtain a fresh inventory seat hold.",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "hi": {
                "title": "सीट आरक्षण होल्ड समाप्त",
                "explanation": "भुगतान पूरा करने के दौरान आपकी अस्थायी 4-मिनट की सीट होल्ड समाप्त हो गई।",
                "action": "नया सीट होल्ड प्राप्त करने के लिए अपनी ट्रेन का पुनः चयन करें।",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "bn": {
                "title": "আসন সংরক্ষণের মেয়াদ শেষ",
                "explanation": "পেমেন্ট শেষ করার সময় আপনার সাময়িক ৪ মিনিটের আসন দখলের মেয়াদ শেষ হয়েছে।",
                "action": "নতুন আসন পেতে আবার আপনার ট্রেন নির্বাচন করুন।",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "ta": {
                "title": "இருக்கை ஒதுக்கீடு நேரம் முடிந்தது",
                "explanation": "பணம் செலுத்தும் போது 4 நிமிட இருக்கை ஒதுக்கீடு காலம் முடிவடைந்தது.",
                "action": "புதிய இருக்கை ஒதுக்கீடு பெற மீண்டும் ரயிலைத் தேர்ந்தெடுக்கவும்.",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
        },
        "TOKEN_BUCKET_THROTTLED": {
            "en": {
                "title": "Fair Access Rate Limit Exceeded",
                "explanation": "High request frequency detected. NIRANTAR Dhara rate-limiting protects genuine citizens.",
                "action": "Please wait 10 seconds before refreshing. Your inventory hold remains locked.",
                "can_retry": False,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 10,
            },
            "hi": {
                "title": "अनुरोध सीमा पार हो गई",
                "explanation": "अत्यधिक अनुरोधों का पता चला है। निरंतर धारा दर-सीमा वास्तविक नागरिकों की सुरक्षा करती है।",
                "action": "कृपया 10 सेकंड प्रतीक्षा करें। आपकी सीट सुरक्षित है।",
                "can_retry": False,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 10,
            },
            "bn": {
                "title": "অনুরোধ সীমা অতিক্রম করেছে",
                "explanation": "স্বাভাবিকের চেয়ে দ্রুত অনুরোধ পাওয়া গেছে। সাধারণ নাগরিকদের সুরক্ষায় সীমিতকরণ সক্রিয়।",
                "action": "অনুগ্রহ করে ১০ সেকেন্ড অপেক্ষা করুন। আপনার আসন সুরক্ষিত।",
                "can_retry": False,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 10,
            },
            "ta": {
                "title": "அணுகல் வரம்பு தாண்டப்பட்டது",
                "explanation": "அதிக கோரிக்கைகள் கண்டறியப்பட்டன. உண்மையான குடிமக்களைப் பாதுகாக்க தற்காலிக கட்டுப்பாடு.",
                "action": "தயவுசெய்து 10 வினாடிகள் காத்திருக்கவும். உங்கள் இருக்கை பாதுகாப்பானது.",
                "can_retry": False,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 10,
            },
        },
        "GATEWAY_TIMEOUT": {
            "en": {
                "title": "Rail Gateway Timeout",
                "explanation": "The backend railway subsystem experienced temporary network latency.",
                "action": "Your transaction context is preserved. Click 'Retry' to re-submit safely.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 180,
            },
            "hi": {
                "title": "रेलवे गेटवे टाइमआउट",
                "explanation": "बैकएंड रेलवे सबसिस्टम में अस्थायी नेटवर्क देरी हुई।",
                "action": "आपका विवरण सुरक्षित है। सुरक्षित रूप से पुनः सबमिट करने के लिए 'पुनः प्रयास करें' पर क्लिक करें।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 180,
            },
            "bn": {
                "title": "রেলওয়ে গেটওয়ে টাইমআউট",
                "explanation": "ব্যাকএন্ড রেলওয়ে সিস্টেমে সাময়িক নেটওয়ার্ক বিলম্ব ঘটেছে।",
                "action": "আপনার তথ্য সংরক্ষিত আছে। আবার চেষ্টা করতে 'পুনরায় চেষ্টা' বোতামে ক্লিক করুন।",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 180,
            },
            "ta": {
                "title": "ரயில்வே கேட்வே நேரம் முடிந்தது",
                "explanation": "ரயில்வே அமைப்பில் தற்காலிக நெட்வொர்க் தாமதம் ஏற்பட்டது.",
                "action": "உங்கள் தகவல்கள் பாதுகாப்பாக உள்ளன. மீண்டும் முயற்சிக்கவும்.",
                "can_retry": True,
                "inventory_hold_active": True,
                "lock_expiry_seconds": 180,
            },
        },
        "DATABASE_QUEUE_SATURATED": {
            "en": {
                "title": "High Booking Demand (Tatkal Rush)",
                "explanation": "Over 12,000 citizens are currently booking tickets. You have been placed in the priority queue.",
                "action": "Please do not refresh. Your position is #42. Estimated wait: 8 seconds.",
                "can_retry": False,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "hi": {
                "title": "अत्यधिक बुकिंग मांग (तत्काल भीड़)",
                "explanation": "वर्तमान में 12,000 से अधिक नागरिक बुकिंग कर रहे हैं। आपको प्राथमिकता कतार में रखा गया है।",
                "action": "कृपया पेज रीफ्रेश न करें। आपकी कतार संख्या #42 है। अनुमानित समय: 8 सेकंड।",
                "can_retry": False,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "bn": {
                "title": "অতিরিক্ত বুকিং চাপ (তৎকাল ভিড়)",
                "explanation": "বর্তমানে ১২,০০০ এর বেশি নাগরিক টিকিট বুক করছেন। আপনাকে অগ্রাধিকার লাইনে রাখা হয়েছে।",
                "action": "অনুগ্রহ করে রিফ্রেশ করবেন না। আপনার সিরিয়াল #৪২। সম্ভাব্য সময়: ৮ সেকেন্ড।",
                "can_retry": False,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "ta": {
                "title": "அதிக முன்பதிவு தேவை",
                "explanation": "தற்போது 12,000 க்கும் மேற்பட்ட குடிமக்கள் முன்பதிவு செய்கிறார்கள். நீங்கள் வரிசையில் வைக்கப்பட்டுள்ளீர்கள்.",
                "action": "புதுப்பிக்க வேண்டாம். உங்கள் வரிசை எண் #42. மதிப்பிடப்பட்ட நேரம்: 8 வினாடிகள்.",
                "can_retry": False,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
        },
        "SEAT_EXHAUSTED": {
            "en": {
                "title": "Confirmed Seats Exhausted",
                "explanation": "Confirmed seats ran out during your session. RAC/Waitlist is currently available.",
                "action": "Would you like to book under RAC or view alternative trains on this route?",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "hi": {
                "title": "कन्फर्म सीटें समाप्त",
                "explanation": "पुष्टि सीटें समाप्त हो गई हैं। वर्तमान में RAC / वेटलिस्ट उपलब्ध है।",
                "action": "क्या आप RAC के तहत बुक करना चाहते हैं या इस रूट पर अन्य ट्रेनें देखना चाहते हैं?",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "bn": {
                "title": "কনফার্মড আসন সমাপ্ত",
                "explanation": "কনফার্মড আসন পূর্ণ হয়ে গেছে। বর্তমানে RAC / ওয়েটলিস্ট উপলব্ধ রয়েছে।",
                "action": "আপনি কি RAC-তে বুক করতে চান নাকি বিকল্প ট্রেন দেখতে চান?",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
            "ta": {
                "title": "உறுதிப்படுத்தப்பட்ட இருக்கைகள் முடிவடைந்தன",
                "explanation": "உறுதிப்படுத்தப்பட்ட இருக்கைகள் முடிந்துவிட்டன. RAC / காத்திருப்போர் பட்டியல் கிடைக்கிறது.",
                "action": "நீங்கள் RAC இல் முன்பதிவு செய்ய விரும்புகிறீர்களா அல்லது மாற்று ரயில்களைப் பார்க்க விரும்புகிறீர்களா?",
                "can_retry": True,
                "inventory_hold_active": False,
                "lock_expiry_seconds": 0,
            },
        },
    }

    def evaluate_failure(
        self,
        error_code: str,
        context: Optional[Dict[str, Any]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Convert system error code into actionable recovery instructions."""
        lang = language if language in ["hi", "bn", "ta", "en"] else "en"
        context = context or {}

        upper_code = str(error_code).upper()

        if "PAYMENT_UNKNOWN" in upper_code or "UNKNOWN_PAYMENT" in upper_code or "PENDING" in upper_code:
            normalized_code = "PAYMENT_UNKNOWN"
        elif "SEAT_HOLD_EXPIRED" in upper_code or "LOCK_EXPIRED" in upper_code or "HOLD_EXPIRED" in upper_code:
            normalized_code = "SEAT_HOLD_EXPIRED"
        elif "TOKEN_BUCKET" in upper_code or "THROTTLED" in upper_code or "RATE_LIMIT" in upper_code or "429" in upper_code:
            normalized_code = "TOKEN_BUCKET_THROTTLED"
        elif "GATEWAY_TIMEOUT" in upper_code or "504" in upper_code or "GATEWAY_DELAY" in upper_code:
            normalized_code = "GATEWAY_TIMEOUT"
        elif "PAYMENT_TIMEOUT" in upper_code:
            normalized_code = "PAYMENT_TIMEOUT"
        elif "502" in upper_code or "QUEUE" in upper_code or "OVERLOAD" in upper_code:
            normalized_code = "DATABASE_QUEUE_SATURATED"
        elif "OUT_OF_STOCK" in upper_code or "FULL" in upper_code or "NO_SEATS" in upper_code or "EXHAUSTED" in upper_code:
            normalized_code = "SEAT_EXHAUSTED"
        else:
            normalized_code = upper_code if upper_code in self.RECOVERY_KNOWLEDGE_BASE else "PAYMENT_TIMEOUT"

        recovery_entry = self.RECOVERY_KNOWLEDGE_BASE.get(normalized_code, self.RECOVERY_KNOWLEDGE_BASE["PAYMENT_TIMEOUT"])
        recovery_info = recovery_entry.get(lang, recovery_entry["en"])

        return {
            "error_category": normalized_code,
            "title": recovery_info["title"],
            "human_explanation": recovery_info["explanation"],
            "recommended_action": recovery_info["action"],
            "can_auto_retry": recovery_info.get("can_retry", True),
            "inventory_hold_active": recovery_info.get("inventory_hold_active", False),
            "lock_expiry_seconds": recovery_info.get("lock_expiry_seconds", 0),
            "preserved_context": context,
        }
