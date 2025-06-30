import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ServiceHealthCard from '../../components/ServiceHealthCard';

// Mock StatusIndicator
jest.mock('../../components/StatusIndicator', () => {
  return function StatusIndicator({ status, size }) {
    return (
      <View testID="status-indicator" 
            style={{ width: size || 12, height: size || 12 }}
            accessibilityLabel={`Status: ${status}`} />
    );
  };
});

describe('ServiceHealthCard Component', () => {
  const defaultProps = {
    name: 'Test Service',
    status: 'healthy',
    detail: 'Running smoothly'
  };

  it('renders without crashing', () => {
    const { getByText } = render(<ServiceHealthCard {...defaultProps} />);
    expect(getByText('Test Service')).toBeTruthy();
    expect(getByText('Running smoothly')).toBeTruthy();
  });

  it('includes StatusIndicator with correct props', () => {
    const { getByTestId } = render(<ServiceHealthCard {...defaultProps} />);
    const statusIndicator = getByTestId('status-indicator');
    expect(statusIndicator).toBeTruthy();
    expect(statusIndicator.props.accessibilityLabel).toBe('Status: healthy');
  });

  it('renders restart button when onRestart is provided', () => {
    const mockRestart = jest.fn();
    const { getByText } = render(
      <ServiceHealthCard {...defaultProps} onRestart={mockRestart} />
    );
    expect(getByText('Restart')).toBeTruthy();
  });

  it('does not render restart button when onRestart is not provided', () => {
    const { queryByText } = render(<ServiceHealthCard {...defaultProps} />);
    expect(queryByText('Restart')).toBeNull();
  });

  it('calls onRestart when restart button is pressed', () => {
    const mockRestart = jest.fn();
    const { getByText } = render(
      <ServiceHealthCard {...defaultProps} onRestart={mockRestart} />
    );
    
    fireEvent.press(getByText('Restart'));
    expect(mockRestart).toHaveBeenCalledTimes(1);
  });

  it('disables interaction when loading', () => {
    const mockRestart = jest.fn();
    const { getByText } = render(
      <ServiceHealthCard {...defaultProps} onRestart={mockRestart} loading={true} />
    );
    
    const button = getByText('Restarting...');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it('shows loading text when loading', () => {
    const { getByText } = render(
      <ServiceHealthCard {...defaultProps} onRestart={() => {}} loading={true} />
    );
    expect(getByText('Restarting...')).toBeTruthy();
  });

  it('applies correct styles for different statuses', () => {
    const { rerender, getByTestId } = render(
      <ServiceHealthCard {...defaultProps} status="error" />
    );
    
    let card = getByTestId('service-health-card');
    expect(card.props.style).toMatchObject(expect.objectContaining({
      borderLeftColor: expect.any(String)
    }));

    rerender(<ServiceHealthCard {...defaultProps} status="warning" />);
    card = getByTestId('service-health-card');
    expect(card.props.style).toMatchObject(expect.objectContaining({
      borderLeftColor: expect.any(String)
    }));
  });
});
