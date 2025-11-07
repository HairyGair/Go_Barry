/**
 * Quick Feedback Widget - Ultra-simple feedback collection
 * Minimal friction, maximum feedback
 */

import React, { useState, useRef, useEffect } from 'react';
import './QuickFeedback.css';

export default function QuickFeedback() {
  const [mode, setMode] = useState('button'); // button, quick, detailed, success
  const [sentiment, setSentiment] = useState(null);
  const [quickMessage, setQuickMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Quick feedback templates based on sentiment
  const quickTemplates = {
    happy: [
      "Easy to use",
      "Works great",
      "Love the new feature",
      "Other..."
    ],
    neutral: [
      "Confusing navigation",
      "Needs improvement",
      "Feature suggestion",
      "Other..."
    ],
    sad: [
      "Something's broken",
      "Can't find what I need",
      "Feature not working",
      "Other..."
    ]
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Capture screenshot
  const captureScreenshot = async () => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Use html2canvas library if available, otherwise return placeholder
      if (window.html2canvas) {
        const screenshot = await window.html2canvas(document.body);
        return screenshot.toDataURL();
      }
      return null;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  };

  // Submit quick feedback
  const submitQuickFeedback = async () => {
    setIsSubmitting(true);

    try {
      // Capture current context
      const context = {
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        // Capture any active breakdown/wizard state from localStorage
        activeBreakdown: localStorage.getItem('activeBreakdownId'),
        currentStep: localStorage.getItem('wizardCurrentStep')
      };

      // Determine title and description based on sentiment
      const sentimentEmoji = sentiment === 'happy' ? '😊' : sentiment === 'neutral' ? '😐' : '😞';
      const title = `Quick Feedback: ${sentimentEmoji} ${quickMessage || 'User feedback'}`;

      const description = `
User submitted quick feedback:
Sentiment: ${sentiment}
Message: ${quickMessage || 'No additional message'}
Page: ${context.page}
      `.trim();

      const feedbackData = {
        title,
        description,
        type: 'feedback',
        severity: sentiment === 'sad' ? 'medium' : 'low',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo: {
          language: navigator.language,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        },
        additionalData: context,
        appVersion: '3.0.0',
        environment: import.meta.env.VITE_ENV || 'production'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bug-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        setMode('success');
        setTimeout(() => {
          setMode('button');
          setSentiment(null);
          setQuickMessage('');
          setAudioBlob(null);
        }, 3000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render based on current mode
  if (mode === 'button') {
    return (
      <div className="quick-feedback-widget">
        <button
          className="quick-feedback-trigger"
          onClick={() => setMode('quick')}
          title="Give Feedback"
        >
          💬
        </button>
      </div>
    );
  }

  if (mode === 'success') {
    return (
      <div className="quick-feedback-widget expanded">
        <div className="quick-feedback-success">
          <div className="success-checkmark">✓</div>
          <p>Thanks for your feedback!</p>
        </div>
      </div>
    );
  }

  if (mode === 'quick') {
    return (
      <div className="quick-feedback-widget expanded">
        <div className="quick-feedback-panel">
          <div className="panel-header">
            <h3>How's it going?</h3>
            <button
              className="close-btn"
              onClick={() => setMode('button')}
            >
              ✕
            </button>
          </div>

          {!sentiment ? (
            // Step 1: Choose sentiment
            <div className="sentiment-selector">
              <button
                className="sentiment-btn happy"
                onClick={() => setSentiment('happy')}
              >
                <span className="emoji">😊</span>
                <span className="label">Great!</span>
              </button>
              <button
                className="sentiment-btn neutral"
                onClick={() => setSentiment('neutral')}
              >
                <span className="emoji">😐</span>
                <span className="label">Okay</span>
              </button>
              <button
                className="sentiment-btn sad"
                onClick={() => setSentiment('sad')}
              >
                <span className="emoji">😞</span>
                <span className="label">Issue</span>
              </button>
            </div>
          ) : (
            // Step 2: Optional details
            <div className="feedback-details">
              <p className="selected-sentiment">
                You selected: {sentiment === 'happy' ? '😊 Great' : sentiment === 'neutral' ? '😐 Okay' : '😞 Issue'}
              </p>

              <div className="quick-options">
                <p className="quick-label">Quick select (optional):</p>
                <div className="quick-buttons">
                  {quickTemplates[sentiment].map((template, index) => (
                    <button
                      key={index}
                      className={`quick-option ${quickMessage === template ? 'selected' : ''}`}
                      onClick={() => setQuickMessage(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              <div className="voice-input">
                <button
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <>
                      <span className="pulse">🔴</span> Recording... (click to stop)
                    </>
                  ) : (
                    <>
                      🎤 Or record a voice note
                    </>
                  )}
                </button>
                {audioBlob && (
                  <p className="audio-recorded">✓ Voice note recorded</p>
                )}
              </div>

              <textarea
                className="feedback-textarea"
                placeholder="Anything else? (optional)"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                rows={3}
              />

              <div className="action-buttons">
                <button
                  className="btn-submit"
                  onClick={submitQuickFeedback}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
                <button
                  className="btn-skip"
                  onClick={submitQuickFeedback}
                  disabled={isSubmitting}
                >
                  Skip & Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
