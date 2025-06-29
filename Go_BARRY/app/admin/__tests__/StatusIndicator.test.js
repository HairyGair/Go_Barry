// Unit tests for StatusIndicator component
import React from 'react';
import { render } from '@testing-library/react-native';
import StatusIndicator from '../components/StatusIndicator';

describe('StatusIndicator Component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <StatusIndicator status="active" testID="status-indicator" />
    );
    expect(getByTestId('status-indicator')).toBeTruthy();
  });

  it('applies correct color for active status', () => {
    const { getByTestId } = render(
      <StatusIndicator status="active" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/#10b981|rgb\(16,\s?185,\s?129\)/)
      })
    );
  });

  it('applies correct color for error status', () => {
    const { getByTestId } = render(
      <StatusIndicator status="error" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/#ef4444|rgb\(239,\s?68,\s?68\)/)
      })
    );
  });

  it('applies correct color for warning status', () => {
    const { getByTestId } = render(
      <StatusIndicator status="warning" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/#f59e0b|rgb\(245,\s?158,\s?11\)/)
      })
    );
  });

  it('applies correct color for inactive status', () => {
    const { getByTestId } = render(
      <StatusIndicator status="inactive" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/#6b7280|rgb\(107,\s?114,\s?128\)/)
      })
    );
  });

  it('respects custom size prop', () => {
    const { getByTestId } = render(
      <StatusIndicator status="active" size={20} testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        width: 20,
        height: 20
      })
    );
  });

  it('applies default size when size prop not provided', () => {
    const { getByTestId } = render(
      <StatusIndicator status="active" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        width: 12,
        height: 12
      })
    );
  });

  it('handles unknown status gracefully', () => {
    const { getByTestId } = render(
      <StatusIndicator status="unknown" testID="status-indicator" />
    );
    const indicator = getByTestId('status-indicator');
    expect(indicator.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/#6b7280|rgb\(107,\s?114,\s?128\)/)
      })
    );
  });
});
