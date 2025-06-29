import React from 'react';
import { render } from '@testing-library/react-native';
import MetricCard from '../../components/MetricCard';

describe('MetricCard Component', () => {
  const defaultProps = {
    label: 'Test Metric',
    value: '100',
    detail: 'Test detail'
  };

  it('renders without crashing', () => {
    const { getByText } = render(<MetricCard {...defaultProps} />);
    expect(getByText('Test Metric')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
    expect(getByText('Test detail')).toBeTruthy();
  });

  it('applies custom color when provided', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} color="#ff0000" />
    );
    const value = getByTestId('metric-value');
    expect(value.props.style[1].color).toBe('#ff0000');
  });

  it('renders progress bar when showProgress is true', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={0.75} />
    );
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('does not render progress bar when showProgress is false', () => {
    const { queryByTestId } = render(
      <MetricCard {...defaultProps} showProgress={false} />
    );
    expect(queryByTestId('progress-bar')).toBeNull();
  });

  it('calculates progress bar width correctly', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={0.6} />
    );
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style.width).toBe('60%');
  });

  it('handles progress greater than 1', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={1.5} />
    );
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style.width).toBe('100%');
  });

  it('handles negative progress', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={-0.5} />
    );
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style.width).toBe('0%');
  });

  it('applies correct progress bar color', () => {
    const { getByTestId } = render(
      <MetricCard {...defaultProps} showProgress={true} progress={0.5} color="#00ff00" />
    );
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style.backgroundColor).toBe('#00ff00');
  });
});
