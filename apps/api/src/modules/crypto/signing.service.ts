import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SignatureResult {
  signedXml: string;
  signatureValue: string;
}

@Injectable()
export class SigningService {
  private readonly logger = new Logger(SigningService.name);

  /**
   * Sign an XML package using XMLDSig-compatible RSA-SHA256 signature.
   * Embeds the signature as a <Signature> element within the XML.
   */
  signPackage(xmlData: string, privateKey: string, certificate: string): SignatureResult {
    // Compute the digest of the XML content
    const digest = crypto.createHash('sha256').update(xmlData, 'utf8').digest('base64');

    // Build the SignedInfo canonical form
    const signedInfo = [
      '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">',
      '<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>',
      '<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>',
      '<Reference URI="">',
      '<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>',
      `<DigestValue>${digest}</DigestValue>`,
      '</Reference>',
      '</SignedInfo>',
    ].join('');

    // Sign the SignedInfo block
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signedInfo);
    const signatureValue = signer.sign(privateKey, 'base64');

    // Strip PEM headers from certificate for embedding
    const certBase64 = certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');

    // Build the Signature element
    const signatureElement = [
      '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
      signedInfo,
      `<SignatureValue>${signatureValue}</SignatureValue>`,
      '<KeyInfo>',
      '<X509Data>',
      `<X509Certificate>${certBase64}</X509Certificate>`,
      '</X509Data>',
      '</KeyInfo>',
      '</Signature>',
    ].join('');

    // Insert the Signature element before the closing root tag
    const closingTagMatch = xmlData.match(/<\/([^>]+)>\s*$/);
    let signedXml: string;
    if (closingTagMatch) {
      const insertPos = xmlData.lastIndexOf(closingTagMatch[0]);
      signedXml = xmlData.slice(0, insertPos) + signatureElement + xmlData.slice(insertPos);
    } else {
      signedXml = xmlData + signatureElement;
    }

    this.logger.debug('XML package signed successfully');

    return { signedXml, signatureValue };
  }

  /**
   * Verify an XMLDSig signature on a signed XML document.
   */
  verifySignature(signedXml: string, certificate: string): boolean {
    try {
      // Extract SignatureValue from the signed XML
      const sigValueMatch = signedXml.match(
        /<SignatureValue>([^<]+)<\/SignatureValue>/,
      );
      if (!sigValueMatch) {
        this.logger.warn('No SignatureValue found in signed XML');
        return false;
      }

      // Extract SignedInfo block
      const signedInfoMatch = signedXml.match(
        /<SignedInfo[^>]*>[\s\S]*?<\/SignedInfo>/,
      );
      if (!signedInfoMatch) {
        this.logger.warn('No SignedInfo block found in signed XML');
        return false;
      }

      const signatureValue = sigValueMatch[1];
      const signedInfoBlock = signedInfoMatch[0];

      // Verify the signature
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signedInfoBlock);
      const isValid = verifier.verify(certificate, signatureValue, 'base64');

      this.logger.debug(`Signature verification result: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }
}
