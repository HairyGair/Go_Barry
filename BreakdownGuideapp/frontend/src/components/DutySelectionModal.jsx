import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import backendAuthService from '../services/backend-auth-service';

/**
 * Duty Selection Modal
 * Shown after successful login to select shift duty
 */
const DutySelectionModal = ({ onDutySelected, onSkip }) => {
    const [availableDuties, setAvailableDuties] = useState([]);
    const [selectedDuty, setSelectedDuty] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch available duties on mount
    useEffect(() => {
        fetchDuties();
    }, []);

    const fetchDuties = async () => {
        try {
            // Use Vite environment variable (not process.env)
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

            const response = await fetch(`${apiUrl}/api/auth/duties`);
            const result = await response.json();

            if (result.success && result.duties) {
                setAvailableDuties(result.duties);
            } else {
                setError('Failed to load duties');
            }
        } catch (err) {
            console.error('Error fetching duties:', err);
            setError('Could not load duty shifts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDuty) {
            setError('Please select a duty');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Use authenticated fetch from backend auth service
            const response = await backendAuthService.authenticatedFetch('/api/auth/set-duty', {
                method: 'POST',
                body: JSON.stringify({ duty: selectedDuty })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Duty set successfully:', selectedDuty);
                onDutySelected(selectedDuty, result.shiftInfo);
            } else {
                setError(result.error || 'Failed to set duty');
            }
        } catch (err) {
            console.error('Error setting duty:', err);
            setError('Could not set duty. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="duty-modal-overlay">
            <div className="duty-modal">
                <div className="duty-modal-header">
                    <h2>🕐 Select Your Duty Shift</h2>
                    <p>Choose your current duty shift to continue</p>
                </div>

                {loading ? (
                    <div className="duty-modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading duty shifts...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="duty-modal-form">
                        <div className="duty-options">
                            {availableDuties.map((duty) => (
                                <label
                                    key={duty.code}
                                    className={`duty-option ${selectedDuty === duty.code ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="duty"
                                        value={duty.code}
                                        checked={selectedDuty === duty.code}
                                        onChange={(e) => setSelectedDuty(e.target.value)}
                                    />
                                    <div className="duty-option-content">
                                        <span className="duty-code">{duty.code}</span>
                                        <span className="duty-time">{duty.startTime} - {duty.endTime}</span>
                                        <span className="duty-description">{duty.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {error && (
                            <div className="duty-modal-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="duty-modal-actions">
                            <button
                                type="button"
                                onClick={onSkip}
                                className="btn-secondary"
                                disabled={submitting}
                            >
                                Skip (No Duty)
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!selectedDuty || submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="button-spinner"></span>
                                        Setting Duty...
                                    </>
                                ) : (
                                    <>
                                        <span>✓</span> Start Shift
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                <style jsx>{`
                    .duty-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        backdrop-filter: blur(4px);
                    }

                    .duty-modal {
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        max-width: 600px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        animation: slideUp 0.3s ease-out;
                    }

                    @keyframes slideUp {
                        from {
                            transform: translateY(40px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }

                    .duty-modal-header {
                        background: linear-gradient(135deg, #003B5C 0%, #0066A1 100%);
                        color: white;
                        padding: 32px;
                        text-align: center;
                        border-radius: 16px 16px 0 0;
                    }

                    .duty-modal-header h2 {
                        margin: 0 0 8px 0;
                        font-size: 24px;
                        font-weight: 700;
                    }

                    .duty-modal-header p {
                        margin: 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }

                    .duty-modal-loading {
                        padding: 60px 40px;
                        text-align: center;
                    }

                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f4f6;
                        border-top: 4px solid #0066A1;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .duty-modal-form {
                        padding: 32px;
                    }

                    .duty-options {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 24px;
                    }

                    .duty-option {
                        display: flex;
                        align-items: center;
                        padding: 20px;
                        border: 2px solid #e5e7eb;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .duty-option:hover {
                        border-color: #0066A1;
                        background: #f8fafc;
                        transform: translateX(4px);
                    }

                    .duty-option.selected {
                        border-color: #0066A1;
                        background: linear-gradient(135deg, #e6f2ff 0%, #f0f7ff 100%);
                        box-shadow: 0 4px 12px rgba(0, 102, 161, 0.15);
                    }

                    .duty-option input[type="radio"] {
                        width: 20px;
                        height: 20px;
                        margin-right: 16px;
                        cursor: pointer;
                        accent-color: #0066A1;
                    }

                    .duty-option-content {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        flex: 1;
                    }

                    .duty-code {
                        font-weight: 700;
                        font-size: 18px;
                        color: #1a202c;
                    }

                    .duty-time {
                        font-weight: 600;
                        font-size: 14px;
                        color: #0066A1;
                    }

                    .duty-description {
                        font-size: 13px;
                        color: #6b7280;
                    }

                    .duty-modal-error {
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        color: #dc2626;
                        padding: 12px 16px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                    }

                    .duty-modal-actions {
                        display: flex;
                        gap: 12px;
                    }

                    .duty-modal-actions button {
                        flex: 1;
                        padding: 14px 24px;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #0066A1 0%, #003B5C 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(0, 102, 161, 0.3);
                    }

                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(0, 102, 161, 0.4);
                    }

                    .btn-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .btn-secondary {
                        background: #f3f4f6;
                        color: #4b5563;
                        border: 1px solid #d1d5db;
                    }

                    .btn-secondary:hover:not(:disabled) {
                        background: #e5e7eb;
                    }

                    .button-spinner {
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top: 2px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @media (max-width: 640px) {
                        .duty-modal {
                            max-width: 100%;
                            max-height: 100vh;
                            border-radius: 0;
                        }

                        .duty-modal-header {
                            padding: 24px;
                            border-radius: 0;
                        }

                        .duty-modal-form {
                            padding: 24px;
                        }

                        .duty-option {
                            padding: 16px;
                        }

                        .duty-modal-actions {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default DutySelectionModal;
