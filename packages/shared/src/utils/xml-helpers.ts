/**
 * Lightweight XML extraction helpers using regex.
 * For full parsing, use libxmljs2 or fast-xml-parser in the API layer.
 */

/**
 * Extract the MessageRefId from a CRS/FATCA XML string.
 */
export function extractMessageRefId(xml: string): string | null {
  const match = xml.match(/<MessageRefId>([^<]+)<\/MessageRefId>/);
  return match ? match[1].trim() : null;
}

/**
 * Extract the ReportingPeriod from a CRS/FATCA XML string.
 */
export function extractReportingPeriod(xml: string): string | null {
  const match = xml.match(/<ReportingPeriod>([^<]+)<\/ReportingPeriod>/);
  return match ? match[1].trim() : null;
}

/**
 * Extract the SendingCompanyIN (sender country) from CRS XML.
 */
export function extractSendingCountry(xml: string): string | null {
  // Try CRS format
  let match = xml.match(/<SendingCompanyIN>([^<]+)<\/SendingCompanyIN>/);
  if (match) return match[1].trim().substring(0, 2);

  // Try FATCA format
  match = xml.match(/<MessageSpec>[\s\S]*?<SendingCountry>([^<]+)<\/SendingCountry>/);
  return match ? match[1].trim() : null;
}

/**
 * Extract the ReceivingCountry from CRS/FATCA XML.
 */
export function extractReceivingCountry(xml: string): string | null {
  const match = xml.match(/<ReceivingCountry>([^<]+)<\/ReceivingCountry>/);
  return match ? match[1].trim() : null;
}

/**
 * Detect whether an XML string is CRS or FATCA based on namespace/root element.
 */
export function detectSchemaType(xml: string): 'CRS' | 'FATCA' | null {
  if (xml.includes('urn:oecd:ties:crs:v') || xml.includes('<CrsBody>')) {
    return 'CRS';
  }
  if (xml.includes('urn:oecd:ties:fatca:v') || xml.includes('<FatcaBody>') || xml.includes('<FATCA>')) {
    return 'FATCA';
  }
  return null;
}
