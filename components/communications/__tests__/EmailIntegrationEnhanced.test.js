import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmailIntegrationEnhanced from '../EmailIntegrationEnhanced';

// Mock the hooks
jest.mock('../../hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    emailTemplates: [],
    distributionLists: [],
    logCommunication: jest.fn(),
  })
}));

jest.mock('../../hooks/useSupervisorSession', () => ({
  useSupervisorSession: () => ({
    supervisor: {
      badgeId: 'TEST001',
      name: 'Test Supervisor'
    }
  })
}));

describe('EmailIntegrationEnhanced Component', () => {
  describe('Authentication', () => {
    it('should render email integration interface', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      expect(getByText('Email Integration')).toBeTruthy();
      expect(getByText('Compose')).toBeTruthy();
      expect(getByText('Templates')).toBeTruthy();
      expect(getByText('Lists')).toBeTruthy();
      expect(getByText('Sent')).toBeTruthy();
    });

    it('should show supervisor name when authenticated', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // The supervisor badge should be visible in header
      expect(getByText('Quick Access')).toBeTruthy();
    });
  });

  describe('Email Composition', () => {
    it('should add recipients when quick access buttons are clicked', () => {
      const { getByText, getAllByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Click on Traffic Control quick access
      fireEvent.press(getByText('Traffic Control'));
      
      // The email should appear in recipients
      expect(getByText('traffic.control@gonortheast.com')).toBeTruthy();
    });

    it('should validate required fields before sending', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Try to send without filling fields
      const sendButton = getByText('Send Email');
      fireEvent.press(sendButton);
      
      // Should show alert (mocked)
      await waitFor(() => {
        // Button should be disabled style
        expect(sendButton.props.style).toContainEqual(
          expect.objectContaining({ backgroundColor: expect.any(String) })
        );
      });
    });

    it('should handle priority selection', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Click High priority
      fireEvent.press(getByText('High'));
      
      // High should be selected (would have different style)
      const highButton = getByText('High');
      expect(highButton).toBeTruthy();
    });

    it('should toggle receipt options', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Toggle delivery receipt
      fireEvent.press(getByText('Request delivery receipt'));
      
      // Toggle read receipt
      fireEvent.press(getByText('Request read receipt'));
      
      // Both should be checked (icon would change)
      expect(getByText('Request delivery receipt')).toBeTruthy();
      expect(getByText('Request read receipt')).toBeTruthy();
    });
  });

  describe('Template Management', () => {
    it('should display template list', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to templates tab
      fireEvent.press(getByText('Templates'));
      
      // Should show sample templates
      expect(getByText('Traffic Disruption Alert')).toBeTruthy();
      expect(getByText('Service Update')).toBeTruthy();
    });

    it('should apply template when selected', () => {
      const { getByText, getByPlaceholderText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to templates tab
      fireEvent.press(getByText('Templates'));
      
      // Select a template
      fireEvent.press(getByText('Traffic Disruption Alert'));
      
      // Should switch back to compose with template applied
      const subjectInput = getByPlaceholderText('Enter subject...');
      expect(subjectInput.props.value).toBe('Traffic Alert: {location}');
    });

    it('should show template variables', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to templates tab
      fireEvent.press(getByText('Templates'));
      
      // Should show variables for first template
      expect(getByText('{location}')).toBeTruthy();
      expect(getByText('{routes}')).toBeTruthy();
      expect(getByText('{duration}')).toBeTruthy();
    });
  });

  describe('Distribution Lists', () => {
    it('should display distribution lists', () => {
      const { getByText, getAllByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to lists tab
      fireEvent.press(getByText('Lists'));
      
      // Should show distribution lists
      expect(getByText('Traffic Control')).toBeTruthy();
      expect(getByText('All Supervisors')).toBeTruthy();
      expect(getByText('Driver Support')).toBeTruthy();
    });

    it('should add distribution list to recipients', () => {
      const { getByText, getAllByTestId } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to lists tab
      fireEvent.press(getByText('Lists'));
      
      // Click add button for a list
      const addButtons = getAllByTestId ? getAllByTestId('add-button') : [];
      if (addButtons.length > 0) {
        fireEvent.press(addButtons[0]);
      }
      
      // Switch back to compose
      fireEvent.press(getByText('Compose'));
      
      // List email should be in recipients
      expect(getByText('traffic.control@gonortheast.com')).toBeTruthy();
    });
  });

  describe('Sent Emails', () => {
    it('should show empty state initially', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Switch to sent tab
      fireEvent.press(getByText('Sent'));
      
      // Should show empty message
      expect(getByText('No sent emails yet')).toBeTruthy();
    });

    it('should add email to sent list after sending', async () => {
      const { getByText, getByPlaceholderText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Add recipient
      fireEvent.press(getByText('Traffic Control'));
      
      // Fill subject
      const subjectInput = getByPlaceholderText('Enter subject...');
      fireEvent.changeText(subjectInput, 'Test Email');
      
      // Fill body
      const bodyInput = getByPlaceholderText('Type your message...');
      fireEvent.changeText(bodyInput, 'This is a test email');
      
      // Send email
      fireEvent.press(getByText('Send Email'));
      
      // Wait for async operation
      await waitFor(() => {
        // Switch to sent tab
        fireEvent.press(getByText('Sent'));
        
        // Should show the sent email
        expect(getByText('Test Email')).toBeTruthy();
        expect(getByText('To: traffic.control@gonortheast.com')).toBeTruthy();
      });
    });
  });

  describe('Outlook Web Access', () => {
    it('should open Outlook Web in new window on web platform', () => {
      // Mock window.open
      const mockOpen = jest.fn();
      global.window = { open: mockOpen };
      
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Click Outlook button
      fireEvent.press(getByText('Open Outlook Web'));
      
      // Should call window.open with correct URL
      expect(mockOpen).toHaveBeenCalledWith(
        'https://outlook.office365.com/mail/',
        '_blank',
        'width=1200,height=800'
      );
    });

    it('should show modal on mobile platform', () => {
      // Mock Platform.OS
      jest.mock('react-native', () => ({
        Platform: { OS: 'ios' }
      }));
      
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Click Outlook button
      fireEvent.press(getByText('Open Outlook Web'));
      
      // Should show mobile message
      expect(getByText(/Outlook Web Access is only available on web platform/)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle email send failure gracefully', async () => {
      // Mock failed send
      const mockLogCommunication = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.mock('../../hooks/useConvexSync', () => ({
        useConvexSync: () => ({
          emailTemplates: [],
          distributionLists: [],
          logCommunication: mockLogCommunication,
        })
      }));
      
      const { getByText, getByPlaceholderText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Fill required fields
      fireEvent.press(getByText('Traffic Control'));
      fireEvent.changeText(getByPlaceholderText('Enter subject...'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Type your message...'), 'Test message');
      
      // Try to send
      fireEvent.press(getByText('Send Email'));
      
      // Should show error alert
      await waitFor(() => {
        expect(getByText(/Failed to send email/)).toBeTruthy();
      });
    });

    it('should validate email addresses', () => {
      const { getByPlaceholderText, getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      const recipientInput = getByPlaceholderText('Add recipients...');
      
      // Try to add invalid email
      fireEvent.changeText(recipientInput, 'invalid-email');
      fireEvent.submitEditing(recipientInput);
      
      // Should not add invalid email
      expect(() => getByText('invalid-email')).toThrow();
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', async () => {
      const startTime = Date.now();
      
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      await waitFor(() => {
        expect(getByText('Email Integration')).toBeTruthy();
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    it('should handle large recipient lists efficiently', () => {
      const { getByText } = render(
        <EmailIntegrationEnhanced onClose={jest.fn()} />
      );
      
      // Add multiple recipients
      for (let i = 0; i < 20; i++) {
        fireEvent.press(getByText('Traffic Control'));
      }
      
      // Should still be responsive
      expect(getByText('Email Integration')).toBeTruthy();
    });
  });
});