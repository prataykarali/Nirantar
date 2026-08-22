"""
NIRANTAR Module 4 — Strict Action Allowlist Enforcement
======================================================
Enforces strict allowlist policy on all incoming execution actions.
Rejects non-allowlisted action attempts immediately with detailed error context.
"""

from typing import Any, Dict, List, Optional, Set, Tuple


class ActionNotAllowedError(ValueError):
    """Exception raised when an action is rejected by the ActionAllowlist."""

    def __init__(self, action: str, details: Dict[str, Any]) -> None:
        self.action = action
        self.details = details
        reason = details.get("reason", f"Action '{action}' is not allowlisted.")
        super().__init__(reason)


class ActionAllowlist:
    """
    Strict security allowlist enforcing permitted actions within NIRANTAR.

    Permitted Actions:
      - search_train
      - filter_results
      - focus_element
      - prepare_autofill
      - explain_payment
      - check_payment_status
    """

    DEFAULT_ALLOWLIST: Set[str] = {
        "search_train",
        "filter_results",
        "focus_element",
        "prepare_autofill",
        "explain_payment",
        "check_payment_status",
    }

    def __init__(self, custom_allowlist: Optional[Set[str]] = None) -> None:
        if custom_allowlist is not None:
            self._allowlist = {act.strip().lower() for act in custom_allowlist if act and isinstance(act, str)}
        else:
            self._allowlist = set(self.DEFAULT_ALLOWLIST)

    @property
    def permitted_actions(self) -> List[str]:
        """Return a sorted list of all permitted action names."""
        return sorted(list(self._allowlist))

    def is_allowed(self, action: str) -> bool:
        """
        Check if action is in the allowlist. Case-insensitive and whitespace-trimmed.
        """
        if not action or not isinstance(action, str):
            return False
        return action.strip().lower() in self._allowlist

    def validate_action(self, action: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate an action against the allowlist.

        Returns:
            Tuple[bool, Dict[str, Any]]: (allowed, context_dict)
        """
        if not action or not isinstance(action, str):
            error_context = {
                "action": str(action),
                "allowed": False,
                "reason": "Action name must be a non-empty string.",
                "error_code": "INVALID_ACTION_NAME",
                "permitted_actions": self.permitted_actions,
            }
            return False, error_context

        clean_action = action.strip().lower()
        if clean_action in self._allowlist:
            return True, {
                "action": clean_action,
                "allowed": True,
                "reason": f"Action '{clean_action}' is permitted by ActionAllowlist.",
                "error_code": None,
            }

        error_context = {
            "action": action,
            "allowed": False,
            "reason": f"Action '{action}' is strictly forbidden or not recognized by NIRANTAR ActionAllowlist.",
            "error_code": "ACTION_NOT_ALLOWLISTED",
            "permitted_actions": self.permitted_actions,
        }
        return False, error_context

    def enforce(self, action: str) -> Dict[str, Any]:
        """
        Enforce allowlist check. Raises ActionNotAllowedError if rejected.
        """
        allowed, context = self.validate_action(action)
        if not allowed:
            raise ActionNotAllowedError(action, context)
        return context
