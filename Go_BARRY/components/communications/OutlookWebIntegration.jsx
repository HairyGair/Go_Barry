import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem, ComponentThemes } from '../../../design-system/design-system-spec';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import { useConvexSync } from '../hooks/useConvexSync';

const OutlookWebIntegration = ({ onClose }) => {
  const { supervisor } = useSupervisorSession();
  const { logCommunication } = useConvexSync();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Theme from design system
  const theme = ComponentThemes.email;

  useEffect(() => {
    // Log the access
    logCommunication({
      type: 'email',
      action: 'outlook_web_opened',
      supervisorId: supervisor?.badgeId,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Unable to load Outlook Web Access. Please check your connection.');
    setIsLoading(false);
  };

  const openInNewWindow = () => {
    if (Platform.OS === 'web') {
      window.open('https://outlook.office365.com/mail/', '_blank');
      onClose();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Outlook Web Access</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={DesignSystem.colors.neutral.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.mobileMessage}>
          <Ionicons name="desktop" size={48} color={theme.primary} />
          <Text style={styles.mobileTitle}>Desktop Only Feature</Text>
          <Text style={styles.mobileText}>
            Outlook Web Access integration is only available on the web version of Go BARRY.
          </Text>
          <Text style={styles.mobileText}>
            Please access this feature from a desktop browser.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mail" size={24} color={theme.primary} />
          <Text style={styles.headerTitle}>Outlook Web Access</Text>
          {supervisor && (
            <View style={styles.supervisorBadge}>
              <Text style={styles.supervisorText}>{supervisor.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openInNewWindow} style={styles.actionButton}>
            <Ionicons name="open-outline" size={20} color={DesignSystem.colors.neutral.text.primary} />
            <Text style={styles.actionText}>Open in New Tab</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={DesignSystem.colors.neutral.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.iframeContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading Outlook Web Access...</Text>
          </View>
        )}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={DesignSystem.colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <iframe
            src="https://outlook.office365.com/mail/"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Outlook Web Access"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Ionicons name="information-circle" size={16} color={DesignSystem.colors.neutral.text.secondary} />
          <Text style={styles.footerText}>
            Sign in with your Go North East Microsoft account
          </Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="help-circle" size={16} color={theme.primary} />
            <Text style={[styles.footerButtonText, { color: theme.primary }]}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border,
    ...Platform.select({
      web: {
        boxShadow: DesignSystem.layout.card.shadowColor + ' 0px 2px 4px',
      },
      default: {
        elevation: 2,
      }
    })
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: DesignSystem.typography.sizes.h2.fontSize,
    fontWeight: DesignSystem.typography.sizes.h2.fontWeight,
    color: DesignSystem.colors.neutral.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
  supervisorBadge: {
    marginLeft: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    backgroundColor: DesignSystem.colors.neutral.background,
    borderRadius: 12,
  },
  supervisorText: {
    fontSize: DesignSystem.typography.sizes.caption.fontSize,
    color: DesignSystem.colors.neutral.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.md,
  },
  actionText: {
    marginLeft: DesignSystem.spacing.xs,
    fontSize: DesignSystem.typography.sizes.bodySmall.fontSize,
    color: DesignSystem.colors.neutral.text.primary,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
  },
  iframeContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DesignSystem.colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.sizes.body.fontSize,
    color: DesignSystem.colors.neutral.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  errorText: {
    marginTop: DesignSystem.spacing.lg,
    fontSize: DesignSystem.typography.sizes.body.fontSize,
    color: DesignSystem.colors.neutral.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  retryButton: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.card.borderRadius / 2,
  },
  retryText: {
    fontSize: DesignSystem.typography.sizes.button.fontSize,
    fontWeight: DesignSystem.typography.sizes.button.fontWeight,
    color: DesignSystem.colors.neutral.text.inverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.neutral.border,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    marginLeft: DesignSystem.spacing.sm,
    fontSize: DesignSystem.typography.sizes.bodySmall.fontSize,
    color: DesignSystem.colors.neutral.text.secondary,
  },
  footerActions: {
    flexDirection: 'row',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  footerButtonText: {
    marginLeft: DesignSystem.spacing.xs,
    fontSize: DesignSystem.typography.sizes.bodySmall.fontSize,
  },
  mobileMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  mobileTitle: {
    fontSize: DesignSystem.typography.sizes.h2.fontSize,
    fontWeight: DesignSystem.typography.sizes.h2.fontWeight,
    color: DesignSystem.colors.neutral.text.primary,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  mobileText: {
    fontSize: DesignSystem.typography.sizes.body.fontSize,
    color: DesignSystem.colors.neutral.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
});

export default OutlookWebIntegration;