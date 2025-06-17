// Go_BARRY/components/SupervisorLogin.jsx
// Web-compatible supervisor login component

import React, { useState } from 'react';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const SupervisorLogin = ({ visible, onClose }) => {
  const [supervisorId, setSupervisorId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDuty, setSelectedDuty] = useState('');
  const [currentStep, setCurrentStep] = useState('supervisor');
  const { login, isLoading, error } = useSupervisorSession();

  // Predefined supervisors
  const supervisors = [
    { id: 'alex_woodcock', name: 'Alex Woodcock', role: 'Supervisor', requiresPassword: false },
    { id: 'andrew_cowley', name: 'Andrew Cowley', role: 'Supervisor', requiresPassword: false },
    { id: 'anthony_gair', name: 'Anthony Gair', role: 'Developer/Admin', requiresPassword: false, isAdmin: true },
    { id: 'claire_fiddler', name: 'Claire Fiddler', role: 'Supervisor', requiresPassword: false },
    { id: 'david_hall', name: 'David Hall', role: 'Supervisor', requiresPassword: false },
    { id: 'james_daglish', name: 'James Daglish', role: 'Supervisor', requiresPassword: false },
    { id: 'john_paterson', name: 'John Paterson', role: 'Supervisor', requiresPassword: false },
    { id: 'simon_glass', name: 'Simon Glass', role: 'Supervisor', requiresPassword: false },
    { id: 'barry_perryman', name: 'Barry Perryman', role: 'Service Delivery Controller - Line Manager', requiresPassword: true, password: 'Barry123', isAdmin: true },
  ];

  // Duty options
  const dutyOptions = [
    { id: '100', name: 'Duty 100 (6am-3:30pm)' },
    { id: '200', name: 'Duty 200 (7:30am-5pm)' },
    { id: '400', name: 'Duty 400 (12:30pm-10pm)' },
    { id: '500', name: 'Duty 500 (2:45pm-12:15am)' },
    { id: 'xops', name: 'XOps' },
  ];

  const selectedSupervisor = supervisors.find(s => s.id === supervisorId);

  const handleSupervisorSelect = (supervisor) => {
    setSupervisorId(supervisor.id);
    if (supervisor.requiresPassword) {
      setCurrentStep('password');
    } else {
      setCurrentStep('duty');
    }
  };

  const handlePasswordSubmit = () => {
    if (selectedSupervisor.requiresPassword) {
      if (!password || password !== selectedSupervisor.password) {
        alert('Incorrect password for Line Manager access.');
        return;
      }
    }
    setCurrentStep('duty');
  };

  const handleDutySelect = async (duty) => {
    setSelectedDuty(duty.id);
    
    const loginData = {
      supervisorId,
      password: selectedSupervisor.requiresPassword ? password : undefined,
      duty: duty,
      isAdmin: selectedSupervisor.isAdmin || false
    };

    const result = await login(loginData);
    
    if (result.success) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setSupervisorId('');
    setPassword('');
    setSelectedDuty('');
    setCurrentStep('supervisor');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'password') {
      setCurrentStep('supervisor');
      setPassword('');
    } else if (currentStep === 'duty') {
      if (selectedSupervisor.requiresPassword) {
        setCurrentStep('password');
      } else {
        setCurrentStep('supervisor');
      }
      setSelectedDuty('');
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxHeight: '90%',
        minHeight: '50%',
        width: '90%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '24px',
          paddingBottom: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              🛡️
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '4px',
              margin: 0
            }}>Supervisor Access</h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              lineHeight: '20px',
              margin: 0
            }}>Log in to manage alerts and access supervisor functions</p>
          </div>
          <button onClick={handleClose} style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: '#F3F4F6',
            border: 'none',
            cursor: 'pointer'
          }}>
            ✕
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FEF2F2',
            padding: '12px',
            marginLeft: '24px',
            marginRight: '24px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid #FECACA'
          }}>
            <span style={{ marginRight: '8px', color: '#EF4444' }}>⚠️</span>
            <span style={{ color: '#DC2626', fontSize: '14px', flex: 1 }}>{error}</span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
          {/* Step 1: Supervisor Selection */}
          {currentStep === 'supervisor' && (
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: '4px'
              }}>Select Your Profile</h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '20px'
              }}>Choose your supervisor profile from the list below</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {supervisors.map((supervisor) => (
                  <button
                    key={supervisor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${supervisorId === supervisor.id ? '#3B82F6' : '#E5E7EB'}`,
                      backgroundColor: supervisorId === supervisor.id ? '#3B82F6' : '#FAFAFA',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                    onClick={() => handleSupervisorSelect(supervisor)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '24px',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        👤
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: supervisorId === supervisor.id ? '#FFFFFF' : '#1F2937',
                          marginBottom: '2px'
                        }}>
                          {supervisor.name}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: supervisorId === supervisor.id ? '#DBEAFE' : '#6B7280',
                          marginBottom: '2px'
                        }}>
                          {supervisor.role}
                        </div>
                        {supervisor.isAdmin && (
                          <div style={{
                            fontSize: '12px',
                            color: '#F59E0B',
                            fontWeight: '600'
                          }}>
                            ⭐ Admin Access
                          </div>
                        )}
                      </div>
                    </div>
                    {supervisorId === supervisor.id && (
                      <span style={{ color: '#FFFFFF' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Password Verification */}
          {currentStep === 'password' && selectedSupervisor && (
            <div>
              <button 
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                ← <span style={{ marginLeft: '4px' }}>Back to selection</span>
              </button>

              <div style={{
                backgroundColor: '#EFF6FF',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #DBEAFE',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    backgroundColor: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <span style={{ color: '#FFFFFF' }}>👤</span>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1E40AF',
                      marginBottom: '2px'
                    }}>
                      {selectedSupervisor.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#3730A3'
                    }}>
                      {selectedSupervisor.role}
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: '4px'
              }}>Line Manager Authentication</h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '20px'
              }}>Enter your password to access Line Manager functions</p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  display: 'block'
                }}>Password</label>
                <input
                  type="password"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    color: '#1F2937',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF'
                  }}
                  placeholder="Enter Line Manager password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>Required for Line Manager access and admin functions</p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #BBF7D0'
              }}>
                <span style={{ marginRight: '8px', color: '#10B981' }}>🛡️</span>
                <span style={{
                  fontSize: '12px',
                  color: '#15803D',
                  flex: 1,
                  lineHeight: '16px'
                }}>All Line Manager actions are logged for accountability and audit purposes</span>
              </div>
            </div>
          )}

          {/* Step 3: Duty Selection */}
          {currentStep === 'duty' && (
            <div>
              <button 
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                ← <span style={{ marginLeft: '4px' }}>Back</span>
              </button>

              <div style={{
                backgroundColor: '#EFF6FF',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #DBEAFE',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    backgroundColor: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <span style={{ color: '#FFFFFF' }}>👤</span>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1E40AF',
                      marginBottom: '2px'
                    }}>
                      {selectedSupervisor.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#3730A3'
                    }}>
                      {selectedSupervisor.role}
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: '4px'
              }}>Select Your Duty</h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '20px'
              }}>Choose which duty you are performing today</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dutyOptions.map((duty) => (
                  <button
                    key={duty.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${selectedDuty === duty.id ? '#10B981' : '#E5E7EB'}`,
                      backgroundColor: selectedDuty === duty.id ? '#10B981' : '#FAFAFA',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                    onClick={() => handleDutySelect(duty)}
                    disabled={isLoading}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: selectedDuty === duty.id ? '#FFFFFF' : '#1F2937',
                      flex: 1,
                      textAlign: 'left'
                    }}>
                      {duty.name}
                    </div>
                    {isLoading && selectedDuty === duty.id ? (
                      <span style={{ color: '#FFFFFF' }}>...</span>
                    ) : (
                      <span style={{ 
                        color: selectedDuty === duty.id ? '#FFFFFF' : '#9CA3AF' 
                      }}>›</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '24px' }}>
          {currentStep === 'supervisor' ? (
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: supervisorId ? '#3B82F6' : '#E5E7EB',
                color: supervisorId ? '#FFFFFF' : '#9CA3AF',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                gap: '8px',
                width: '100%',
                cursor: supervisorId ? 'pointer' : 'not-allowed'
              }}
              onClick={() => {
                if (selectedSupervisor) {
                  if (selectedSupervisor.requiresPassword) {
                    setCurrentStep('password');
                  } else {
                    setCurrentStep('duty');
                  }
                }
              }}
              disabled={!supervisorId}
            >
              Continue →
            </button>
          ) : currentStep === 'password' ? (
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: password ? '#3B82F6' : '#E5E7EB',
                color: password ? '#FFFFFF' : '#9CA3AF',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                gap: '8px',
                width: '100%',
                cursor: password ? 'pointer' : 'not-allowed'
              }}
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              Continue to Duty Selection →
            </button>
          ) : null}
        </div>

        {/* Help Section */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>Need Help?</h4>
          <p style={{
            fontSize: '12px',
            color: '#6B7280',
            lineHeight: '16px',
            margin: 0
          }}>Contact your shift manager or IT support if you're having trouble accessing your account.</p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorLogin;
