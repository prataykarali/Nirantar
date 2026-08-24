/**
 * NIRANTAR — Sensitive Data & PII Redactor
 * ========================================
 * Strips PINs, OTPs, Passwords, CVVs, and real identity numbers before
 * queries are sent to external LLMs or stored in conversation state.
 */

export class PiiRedactor {
  private static readonly PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi;
  private static readonly AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  private static readonly OTP_REGEX = /\b(?:otp|code|pin|password|cvv)\s*(?:is|:|=)?\s*([0-9]{4,6})\b/gi;
  private static readonly CARD_NUM_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

  public static redact(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(this.CARD_NUM_REGEX, '[CARD_REDACTED]')
      .replace(this.PAN_REGEX, '[PAN_REDACTED]')
      .replace(this.AADHAAR_REGEX, '[AADHAAR_REDACTED]')
      .replace(this.OTP_REGEX, '[CREDENTIAL_REDACTED]');
  }

  public static containsSensitiveSecret(text: string): boolean {
    if (!text) return false;
    return (
      this.CARD_NUM_REGEX.test(text) ||
      this.OTP_REGEX.test(text) ||
      /\b(?:upi pin|cvv|atm pin|netbanking password)\b/i.test(text)
    );
  }
}
