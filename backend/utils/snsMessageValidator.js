// backend/utils/snsMessageValidator.js
// Validates AWS SNS message signatures to ensure messages are from Amazon SNS
// Based on StreetManager's official example

import crypto from 'crypto';
import https from 'https';
import { URL } from 'url';

/**
 * Validates that the SNS message signature is authentic
 * @param {Object} message - The parsed SNS message
 * @returns {Promise<boolean>} - True if signature is valid
 */
export async function isValidSignature(message) {
  try {
    // Verify signature version
    if (message.SignatureVersion !== '1') {
      console.error('❌ Invalid signature version:', message.SignatureVersion);
      return false;
    }

    // Verify certificate URL is HTTPS
    const certUrl = new URL(message.SigningCertURL);
    if (certUrl.protocol !== 'https:') {
      console.error('❌ Certificate URL not using HTTPS:', message.SigningCertURL);
      return false;
    }

    // Download certificate
    const certificate = await downloadCertificate(message.SigningCertURL);
    
    // Build string to sign based on message type
    const stringToSign = buildStringToSign(message);
    
    // Verify signature
    const verify = crypto.createVerify('sha1WithRSAEncryption');
    verify.write(stringToSign);
    verify.end();
    
    const isValid = verify.verify(certificate, message.Signature, 'base64');
    
    if (isValid) {
      console.log('✅ SNS message signature verified');
    } else {
      console.error('❌ SNS message signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error validating signature:', error);
    return false;
  }
}

/**
 * Downloads the certificate from the provided URL
 */
async function downloadCertificate(certURL) {
  return new Promise((resolve, reject) => {
    https.get(certURL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Builds the string to sign based on message type
 */
function buildStringToSign(message) {
  switch (message.Type) {
    case 'SubscriptionConfirmation':
      return buildSubscriptionStringToSign(message);
    case 'Notification':
      return buildNotificationStringToSign(message);
    case 'UnsubscribeConfirmation':
      return buildUnsubscribeStringToSign(message);
    default:
      throw new Error(`Unknown message type: ${message.Type}`);
  }
}

/**
 * Builds string to sign for subscription confirmations
 */
function buildSubscriptionStringToSign(message) {
  let stringToSign = '';
  stringToSign += "Message\n";
  stringToSign += message.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += message.MessageId + "\n";
  stringToSign += "SubscribeURL\n";
  stringToSign += message.SubscribeURL + "\n";
  stringToSign += "Timestamp\n";
  stringToSign += message.Timestamp + "\n";
  stringToSign += "Token\n";
  stringToSign += message.Token + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += message.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += message.Type + "\n";
  return stringToSign;
}

/**
 * Builds string to sign for notifications
 */
function buildNotificationStringToSign(message) {
  let stringToSign = '';
  stringToSign += "Message\n";
  stringToSign += message.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += message.MessageId + "\n";
  if (message.Subject) {
    stringToSign += "Subject\n";
    stringToSign += message.Subject + "\n";
  }
  stringToSign += "Timestamp\n";
  stringToSign += message.Timestamp + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += message.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += message.Type + "\n";
  return stringToSign;
}

/**
 * Builds string to sign for unsubscribe confirmations
 */
function buildUnsubscribeStringToSign(message) {
  // Similar to subscription confirmation
  return buildSubscriptionStringToSign(message);
}

export default { isValidSignature };
