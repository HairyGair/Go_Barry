/*
 * Go Barry - 8x8 VoIP Integration Tests
 * Test suite for VoIP Integration Component
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import VoIPIntegrationEnhanced from '../VoIPIntegrationEnhanced';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../../hooks/useSupervisorSession', () => ({
  useSupervisor: () => ({
    supervisorName: 'Test Supervisor',
    supervisorId: 'TEST001',
    isAdmin: false
  })
}));

jest.mock('../../../hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    logCommunication: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.open for web
global.window = {
  open: jest.fn()
};

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('VoIPIntegrationEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ history: [], contacts: [] })
    });
  });

  describe('Component Rendering', () => {
    it('renders correctly with all tabs', () => {
      const { getByText } = render(
        <VoIPIntegrationEnhanced visible={true} onClose={jest.fn()} />
      );

      expect(getByText('8x8 VoIP Integration')).toBeTruthy();
      expect(getByText('Dialer')).toBeTruthy();
      expect(getByText('Contacts')).toBeTruthy();
      expect(getByText('History')).toBeTruthy();
      expect(getByText('Emergency')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });

    it('shows quick dial numbers in dialer view', () => {
      const { getByText } = render(
        <VoIPIntegrationEnhanced visible={true} onClose={jest.fn()} />
      );

      expect(getByText('Quick Dial')).toBeTruthy();
      expect(getByText('Control Room')).toBeTruthy();
      expect(getByText('Emergency Depot')).toBeTruthy();
      expect(getByText('IT Support')).toBeTruthy();
    });
  });

  describe('Dialer Functionality', () => {
    it('updates phone number when dial pad is pressed', () => {
      const { getByText, getByPlaceholderText } = render(
        <VoIPIntegrationEnhanced visible={true} onClose={jest.fn()} />
      );

      const input = getByPlaceholderText('Enter phone number');
      
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));

      expect(input.props.value).toBe('123');
    });
  });

  describe('API Integration', () => {
    it('fetches call history on mount', async () => {
      render(<VoIPIntegrationEnhanced visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://go-barry.onrender.com/api/communications/voip/history',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer TEST001'
            })
          })
        );
      });
    });
  });
});