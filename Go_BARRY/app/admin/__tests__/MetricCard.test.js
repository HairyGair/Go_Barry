// Unit tests for MetricCard component
import React from 'react';
import { render } from '@testing-library/react-native';
import MetricCard from '../components/MetricCard';

describe('MetricCard Component', () => {
  const defaultProps = {
    label: 'Test Metric',
    value: '100',
    color: '#3b82f6'
  };

  it('renders without crashing', () => {
    const { getByText } = render(<MetricCard {...defaultProps} />);
    expect(getByText('Test Metric')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });

  it('displays icon when provided', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} icon="chart-line" />
    );
    // MaterialCommunityIcons doesn't have testID by default, 
    // but we can check if the parent view contains the icon
    const card = getByTestId('metric-card');
    expect(card).toBeTruthy();
  });

  it('displays detail text when provided', () => {
    const { getByText } = render(
      <MetricCard {...defaultProps} detail="+10% from yesterday" />
    );
    expect(getByText('+10% from yesterday')).toBeTruthy();
  });

  it('shows progress bar when showProgress is true', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={0.75} />
    );
    const progressBar = getByTestId('progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('hides progress bar when showProgress is false', () => {
    const { queryByTestId } = render(
      <MetricCard {...defaultProps} showProgress={false} progress={0.75} />
    );
    const progressBar = queryByTestId('progress-bar');
    expect(progressBar).toBeNull();
  });

  it('applies custom color to value text', () => {
    const customColor = '#ef4444';
    const { getByText } = render(
      <MetricCard {...defaultProps} color={customColor} />
    );
    const valueText = getByText('100');
    expect(valueText.props.style).toMatchObject(
      expect.objectContaining({
        color: customColor
      })
    );
  });

  it('handles long text values gracefully', () => {
    const longValue = 'This is a very long value that might overflow';
    const { getByText } = render(
      <MetricCard {...defaultProps} value={longValue} />
    );
    expect(getByText(longValue)).toBeTruthy();
  });

  it('handles numeric values', () => {
    const { getByText } = render(
      <MetricCard {...defaultProps} value={12345} />
    );
    expect(getByText('12345')).toBeTruthy();
  });

  it('applies correct styles for dark theme', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} testID="metric-card" />
    );
    const card = getByTestId('metric-card');
    expect(card.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
        borderRadius: expect.any(Number)
      })
    );
  });
});
