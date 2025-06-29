import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SectionHeader from '../../components/SectionHeader';

describe('SectionHeader Component', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<SectionHeader title="Test Section" />);
    expect(getByText('Test Section')).toBeTruthy();
  });

  it('renders with icon when provided', () => {
    const { getByTestId } = render(
      <SectionHeader title="Test" icon="settings" />
    );
    expect(getByTestId('section-icon')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const { getByText } = render(
      <SectionHeader title="Test" actionLabel="Action" onAction={() => {}} />
    );
    expect(getByText('Action')).toBeTruthy();
  });

  it('does not render action button when onAction not provided', () => {
    const { queryByText } = render(
      <SectionHeader title="Test" actionLabel="Action" />
    );
    expect(queryByText('Action')).toBeNull();
  });

  it('calls onAction when action button pressed', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <SectionHeader title="Test" actionLabel="Click Me" onAction={mockAction} />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <SectionHeader title="Test" style={customStyle} />
    );
    
    const header = getByTestId('section-header');
    expect(header.props.style).toMatchObject(expect.objectContaining(customStyle));
  });
});
