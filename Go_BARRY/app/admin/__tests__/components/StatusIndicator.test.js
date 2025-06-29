import React from 'react';
import { render } from '@testing-library/react-native';
import StatusIndicator from '../../components/StatusIndicator';

describe('StatusIndicator Component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<StatusIndicator status="healthy" />);
    expect(getByTestId('status-indicator')).toBeTruthy();
  });

  it('applies correct color for healthy status', () => {
    const { getByTestId } = render(<StatusIndicator status="healthy" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.backgroundColor).toBe('#10b981');
  });

  it('applies correct color for warning status', () => {
    const { getByTestId } = render(<StatusIndicator status="warning" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.backgroundColor).toBe('#f59e0b');
  });

  it('applies correct color for error status', () => {
    const { getByTestId } = render(<StatusIndicator status="error" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.backgroundColor).toBe('#ef4444');
  });

  it('applies correct color for inactive status', () => {
    const { getByTestId } = render(<StatusIndicator status="inactive" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.backgroundColor).toBe('#64748b');
  });

  it('respects custom size prop', () => {
    const { getByTestId } = render(<StatusIndicator status="healthy" size={20} />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.width).toBe(20);
    expect(indicator.props.style.height).toBe(20);
  });

  it('uses default size when not provided', () => {
    const { getByTestId } = render(<StatusIndicator status="healthy" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.width).toBe(12);
    expect(indicator.props.style.height).toBe(12);
  });

  it('handles unknown status gracefully', () => {
    const { getByTestId } = render(<StatusIndicator status="unknown" />);
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style.backgroundColor).toBe('#64748b');
  });
});
