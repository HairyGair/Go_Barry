import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

const useMicrosoftGraph = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // For web-based Outlook integration, we'll use mailto and web access
  // This hook provides a simplified interface that matches the component expectations

  const sendEmail = useCallback(async (emailData) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would use Microsoft Graph API
      // For now, we use mailto protocol which works across platforms
      const { to, cc, bcc, subject, body } = emailData;
      
      const mailtoUrl = `mailto:${to.join(',')}?` +
        (cc?.length ? `cc=${cc.join(',')}&` : '') +
        (bcc?.length ? `bcc=${bcc.join(',')}&` : '') +
        `subject=${encodeURIComponent(subject)}&` +
        `body=${encodeURIComponent(body)}`;

      if (Platform.OS === 'web') {
        window.location.href = mailtoUrl;
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplates = useCallback(async () => {
    // This would fetch from Microsoft Graph or local storage
    // For now, return empty array as templates are managed locally
    return [];
  }, []);

  const getDistributionLists = useCallback(async () => {
    // This would fetch from Microsoft Graph
    // For now, return empty array as lists are managed locally
    return [];
  }, []);

  const authenticate = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would handle OAuth flow
      // For now, we assume authentication via Outlook Web Access
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendEmail,
    getTemplates,
    getDistributionLists,
    authenticate,
    isAuthenticated,
    isLoading,
    error
  };
};

export default useMicrosoftGraph;