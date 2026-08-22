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
            },
            "hi": {
                "title": "भुगतान सत्यापन में देरी",
                "explanation": "आपके बैंक से उत्तर मिलने में सामान्य से अधिक समय लगा। आपके पैसे नहीं कटे हैं।",
                "action": "आपकी सीट 4 मिनट के लिए सुरक्षित है। UPI से पुनः प्रयास करने के लिए नीचे क्लिक करें।",
                "can_retry": True,
            },
            "bn": {
                "title": "পেমেন্ট যাচাইকরণে বিলম্ব",
                "explanation": "আপনার ব্যাংক থেকে প্রতিক্রিয়া পেতে অতিরিক্ত সময় লেগেছে। আপনার টাকা কাটা হয়নি।",
                "action": "আপনার আসনটি ৪ মিনিটের জন্য সংরক্ষিত রয়েছে। UPI দিয়ে পুনরায় চেষ্টা করতে ক্লিক করুন।",
                "can_retry": True,
            },
        },
        "DATABASE_QUEUE_SATURATED": {
            "en": {
                "title": "High Booking Demand (Tatkal Rush)",
                "explanation": "Over 12,000 citizens are currently booking tickets. You have been placed in the priority queue.",
                "action": "Please do not refresh. Your position is #42. Estimated wait: 8 seconds.",
                "can_retry": False,
            },
            "hi": {
                "title": "अत्यधिक बुकिंग मांग (तत्काल भीड़)",
                "explanation": "वर्तमान में 12,000 से अधिक नागरिक बुकिंग कर रहे हैं। आपको प्राथमिकता कतार में रखा गया है।",
                "action": "कृपया पेज रीफ्रेश न करें। आपकी कतार संख्या #42 है। अनुमानित समय: 8 सेकंड।",
                "can_retry": False,
            },
            "bn": {
                "title": "অতিরিক্ত বুকিং চাপ (তৎকাল ভিড়)",
                "explanation": "বর্তমানে ১২,০০০ এর বেশি নাগরিক টিকিট বুক করছেন। আপনাকে অগ্রাধিকার লাইনে রাখা হয়েছে।",
                "action": "অনুগ্রহ করে রিফ্রেশ করবেন না। আপনার সিরিয়াল #৪২। সম্ভাব্য সময়: ৮ সেকেন্ড।",
                "can_retry": False,
            },
        },
        "SEAT_EXHAUSTED": {
            "en": {
                "title": "Confirmed Seats Exhausted",
                "explanation": "Confirmed seats ran out during your session. RAC/Waitlist is currently available.",
                "action": "Would you like to book under RAC or view alternative trains on this route?",
                "can_retry": True,
            },
            "hi": {
                "title": "कन्फर्म सीटें समाप्त",
                "explanation": "पुष्टि सीटें समाप्त हो गई हैं। वर्तमान में RAC / वेटलिस्ट उपलब्ध है।",
                "action": "क्या आप RAC के तहत बुक करना चाहते हैं या इस रूट पर अन्य ट्रेनें देखना चाहते हैं?",
                "can_retry": True,
            },
            "bn": {
                "title": "কনফার্মড আসন সমাপ্ত",
                "explanation": "কনফার্মড আসন পূর্ণ হয়ে গেছে। বর্তমানে RAC / ওয়েটলিস্ট উপলব্ধ রয়েছে।",
                "action": "আপনি কি RAC-তে বুক করতে চান নাকি বিকল্প ট্রেন দেখতে চান?",
                "can_retry": True,
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
        lang = language if language in ["hi", "bn", "en"] else "en"
        context = context or {}

        # Default fallback code
        normalized_code = "PAYMENT_TIMEOUT"
        if "502" in error_code or "QUEUE" in error_code or "OVERLOAD" in error_code:
            normalized_code = "DATABASE_QUEUE_SATURATED"
        elif "OUT_OF_STOCK" in error_code or "FULL" in error_code or "NO_SEATS" in error_code:
            normalized_code = "SEAT_EXHAUSTED"

        recovery_info = self.RECOVERY_KNOWLEDGE_BASE[normalized_code].get(
            lang, self.RECOVERY_KNOWLEDGE_BASE[normalized_code]["en"]
        )

        return {
            "error_category": normalized_code,
            "title": recovery_info["title"],
            "human_explanation": recovery_info["explanation"],
            "recommended_action": recovery_info["action"],
            "can_auto_retry": recovery_info["can_retry"],
            "inventory_hold_active": normalized_code == "PAYMENT_TIMEOUT",
            "lock_expiry_seconds": 240 if normalized_code == "PAYMENT_TIMEOUT" else 0,
            "preserved_context": context,
        }
