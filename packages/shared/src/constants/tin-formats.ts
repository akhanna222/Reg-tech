/**
 * TIN (Taxpayer Identification Number) format patterns per jurisdiction.
 * Each entry is a regex that validates the format (not checksum) of the TIN.
 */
export const TIN_FORMATS: Record<string, RegExp> = {
  US: /^\d{3}-?\d{2}-?\d{4}$/, // SSN: 123-45-6789
  GB: /^\d{10}$|^\d{5}\s?\d{5}$/, // UK UTR: 10 digits
  DE: /^\d{11}$/, // German IdNr: 11 digits
  FR: /^\d{13}$/, // French NIF: 13 digits
  IE: /^\d{7}[A-Z]{1,2}$/, // Irish PPS: 7 digits + 1-2 letters
  AU: /^\d{9}$/, // Australian TFN: 9 digits
  CA: /^\d{9}$/, // Canadian SIN: 9 digits
  NL: /^\d{9}$/, // Dutch BSN: 9 digits
  CH: /^\d{3}\.?\d{3}\.?\d{3}\.?\d{2}$/, // Swiss AHV: 756.XXXX.XXXX.XX
  AT: /^\d{9}$/, // Austrian TIN: 9 digits
  BE: /^\d{11}$/, // Belgian National Number: 11 digits
  DK: /^\d{10}$/, // Danish CPR: 10 digits
  ES: /^[0-9XYZ]\d{7}[A-Z]$/, // Spanish NIF/NIE
  FI: /^\d{6}[-+A]\d{3}[0-9A-Z]$/, // Finnish HETU
  GR: /^\d{9}$/, // Greek AFM: 9 digits
  HU: /^\d{10}$/, // Hungarian: 10 digits
  IT: /^[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/, // Italian Codice Fiscale
  LU: /^\d{13}$/, // Luxembourg: 13 digits
  NO: /^\d{11}$/, // Norwegian: 11 digits
  PL: /^\d{10,11}$/, // Polish PESEL (11) or NIP (10)
  PT: /^\d{9}$/, // Portuguese NIF: 9 digits
  SE: /^\d{12}$/, // Swedish personnummer: 12 digits
  SG: /^[STFGM]\d{7}[A-Z]$/, // Singapore NRIC/FIN
  HK: /^[A-Z]{1,2}\d{6}\(?\d\)?$/, // Hong Kong HKID
  JP: /^\d{12}$/, // Japanese My Number: 12 digits
  KR: /^\d{13}$/, // Korean RRN: 13 digits
  IN: /^[A-Z]{5}\d{4}[A-Z]$/, // Indian PAN
  MX: /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/, // Mexican RFC
  BR: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, // Brazilian CPF
  NZ: /^\d{8,9}$/, // New Zealand IRD: 8-9 digits
  ZA: /^\d{13}$/, // South African ID: 13 digits
};

/**
 * Validate a TIN against the known format for a given jurisdiction.
 * Returns true if the jurisdiction has no registered format (permissive).
 */
export function validateTIN(tin: string, jurisdiction: string): boolean {
  const pattern = TIN_FORMATS[jurisdiction];
  if (!pattern) {
    return true; // No format registered — accept by default
  }
  return pattern.test(tin.trim());
}

/**
 * Get the list of jurisdictions with registered TIN formats.
 */
export function getSupportedTINJurisdictions(): string[] {
  return Object.keys(TIN_FORMATS);
}
