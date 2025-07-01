import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OperationsHeader from '../../../app/operations-centre/components/OperationsHeader';

describe('OperationsHeader', () => {
  const defaultProps = {
    onHomePress: jest.fn(),
    onLogout: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    expect(getByText('Operations Centre')).toBeTruthy();
    expect(getByText('Go North East')).toBeTruthy();
  });

  it('displays home and logout buttons', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
  });

  it('handles home button click', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    const homeButton = getByText('Home');
    
    fireEvent.press(homeButton);
    expect(defaultProps.onHomePress).toHaveBeenCalled();
  });

  it('handles logout button click', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    const logoutButton = getByText('Logout');
    
    fireEvent.press(logoutButton);
    expect(defaultProps.onLogout).toHaveBeenCalled();
  });

  it('applies correct styles', () => {
    const { getByTestId } = render(
      <OperationsHeader {...defaultProps} testID="header" />
    );
    const header = getByTestId('header');
    
    expect(header.props.style).toMatchObject({
      backgroundColor: '#1a1a2e',
      paddingVertical: expect.any(Number),
    });
  });
});
