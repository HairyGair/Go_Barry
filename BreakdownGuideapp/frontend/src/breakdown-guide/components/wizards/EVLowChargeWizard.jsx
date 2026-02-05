// EV Low Charge Wizard Component - Electric vehicle battery charge assessment
// Helps supervisors assess EVs with low charge and coordinate changeover with engineering
import React from 'react';
import * as Icons from '../common/icons.jsx';

function EVLowChargeWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, CheckCircle, Info } = Icons;

  // Determine the decision based on charge level and reachability
  const getDecision = () => {
    const charge = responses.charge_level;
    const canReach = responses.can_reach_changeover;

    if (charge === 'above-30') {
      return {
        severity: 'CONTINUE',
        title: 'CONTINUE IN SERVICE',
        subtitle: 'Charge level is above 30% - no immediate action required',
        color: 'green',
        icon: <CheckCircle className="w-8 h-8 text-green-400" />,
        notes: 'EV charge above 30% - continue in service, monitor charge level',
        actions: [
          'Continue normal service operation',
          'Advise the driver to monitor the charge level display',
          'Plan for charging at the end of the current duty or at a convenient layover',
          'No defect recording required at this time'
        ]
      };
    }

    if (charge === '20-30') {
      if (canReach === 'yes') {
        return {
          severity: 'AMBER',
          title: 'ARRANGE CHANGEOVER',
          subtitle: 'Charge 20-30% - vehicle can reach a changeover point',
          color: 'orange',
          icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
          notes: 'EV charge 20-30%, can reach changeover point - arrange changeover',
          actions: [
            'Arrange changeover at the nearest suitable point',
            'Advise the driver to minimise unnecessary electrical load (heating, USB charging)',
            'Notify engineering of the incoming vehicle for recharging',
            'Record on their handheld device as low charge requiring changeover'
          ]
        };
      }
      return {
        severity: 'AMBER',
        title: 'SEND CHANGEOVER VEHICLE',
        subtitle: 'Charge 20-30% - vehicle cannot reach a changeover point',
        color: 'orange',
        icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
        notes: 'EV charge 20-30%, cannot reach changeover - send changeover vehicle to driver',
        actions: [
          'Send a changeover vehicle to the driver\'s current location',
          'Advise the driver to reduce speed and minimise electrical load',
          'Notify engineering of the situation',
          'Record on their handheld device as low charge requiring roadside changeover'
        ]
      };
    }

    if (charge === '10-20') {
      if (canReach === 'yes') {
        return {
          severity: 'AMBER',
          title: 'URGENT CHANGEOVER',
          subtitle: 'Charge 10-20% - vehicle can reach a changeover point',
          color: 'orange',
          icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
          notes: 'EV charge 10-20%, can reach changeover point - urgent changeover required',
          actions: [
            'Arrange urgent changeover at the nearest possible point',
            'Advise the driver to switch off all non-essential electrical systems immediately',
            'Notify engineering as priority for recharging',
            'Record on their handheld device as urgent low charge changeover'
          ]
        };
      }
      return {
        severity: 'AMBER',
        title: 'IMMEDIATE CHANGEOVER TO LOCATION',
        subtitle: 'Charge 10-20% - vehicle cannot reach a changeover point',
        color: 'orange',
        icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
        notes: 'EV charge 10-20%, cannot reach changeover - immediate changeover to driver location',
        actions: [
          'Dispatch changeover vehicle to the driver immediately',
          'Advise the driver to switch off all non-essential electrical systems',
          'Advise the driver to pull over at the next safe location if charge drops further',
          'Notify engineering as priority',
          'Record on their handheld device as urgent low charge roadside changeover'
        ]
      };
    }

    if (charge === 'below-10') {
      if (canReach === 'yes') {
        return {
          severity: 'AMBER',
          title: 'IMMEDIATE CHANGEOVER - MINIMISE LOAD',
          subtitle: 'Charge below 10% - vehicle can reach a changeover point',
          color: 'orange',
          icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
          notes: 'EV charge below 10%, can reach changeover - immediate changeover, minimise electrical load',
          actions: [
            'Arrange immediate changeover at the nearest point',
            'Advise the driver to switch off ALL non-essential electrical systems now',
            'Advise the driver to reduce speed to maximise remaining range',
            'Notify engineering immediately for priority recharging',
            'Record on their handheld device as critical low charge'
          ]
        };
      }
      return {
        severity: 'STOP',
        title: 'STOP - ARRANGE RECOVERY',
        subtitle: 'Charge below 10% - vehicle cannot reach a changeover point',
        color: 'red',
        icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
        notes: 'EV charge below 10%, cannot reach changeover - stop at safe location, arrange recovery',
        actions: [
          'Advise the driver to stop at the next safe location immediately',
          'Arrange recovery or a changeover vehicle to the driver\'s location',
          'Notify engineering immediately',
          'Arrange passenger transfer if required',
          'Record on their handheld device as critical - vehicle immobilised due to low charge'
        ]
      };
    }

    return null;
  };

  const renderStep = () => {
    switch (currentStep) {
      // Step 1: Introduction
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">⚡</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">EV Low Charge Assessment</h2>
              <p className="text-gray-300">Electric vehicle battery charge level assessment and changeover planning</p>
            </div>

            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
              <h3 className="text-lg font-semibold text-green-200 mb-4">About This Assessment</h3>
              <p className="text-green-300/80 text-sm leading-relaxed">
                Electric vehicles should be planned for changeover when the battery charge drops below 30%.
                This assessment will help determine the urgency of the changeover based on the current charge level
                and whether the vehicle can reach a suitable changeover point.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Key Thresholds</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  <span className="text-gray-300 text-sm"><strong className="text-green-300">Above 30%</strong> - Continue in service, monitor charge</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-gray-300 text-sm"><strong className="text-yellow-300">20-30%</strong> - Plan changeover</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                  <span className="text-gray-300 text-sm"><strong className="text-orange-300">10-20%</strong> - Urgent changeover</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="text-gray-300 text-sm"><strong className="text-red-300">Below 10%</strong> - Critical, may need recovery</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Begin Assessment
              </button>
            </div>
          </div>
        );

      // Step 2: Current Charge Level
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔋</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Current Charge Level</h2>
              <p className="text-gray-300">Ask the driver what the current battery charge percentage is</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">What is the current battery charge level?</h3>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    updateResponse('charge_level', 'above-30');
                    onNext();
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.charge_level === 'above-30'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.charge_level === 'above-30' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.charge_level === 'above-30' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">Above 30%</span>
                      <p className="text-sm text-gray-300 mt-1">Charge is adequate for continued service</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('charge_level', '20-30'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.charge_level === '20-30'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.charge_level === '20-30' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.charge_level === '20-30' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">20-30%</span>
                      <p className="text-sm text-gray-300 mt-1">Changeover should be planned</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('charge_level', '10-20'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.charge_level === '10-20'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.charge_level === '10-20' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.charge_level === '10-20' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">10-20%</span>
                      <p className="text-sm text-gray-300 mt-1">Urgent changeover required</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('charge_level', 'below-10'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.charge_level === 'below-10'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.charge_level === 'below-10' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.charge_level === 'below-10' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">Below 10%</span>
                      <p className="text-sm text-gray-300 mt-1">Critical - may need recovery</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onPrevious}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={onNext}
                disabled={!responses.charge_level}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      // Step 3: Can vehicle reach a changeover point?
      case 3:
        // If above 30%, skip to decision (shouldn't normally reach here due to double-onNext)
        if (responses.charge_level === 'above-30') {
          const decision = getDecision();
          return renderDecision(decision);
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📍</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Can the Vehicle Reach a Changeover Point?</h2>
              <p className="text-gray-300">Based on the charge level and current location, can the vehicle reach a depot or suitable changeover point?</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Can the driver reach a changeover point safely?</h3>
              <p className="text-gray-300 text-sm mb-4">Consider the distance to the nearest depot or agreed changeover location, current charge level, and route conditions.</p>

              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('can_reach_changeover', 'yes'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.can_reach_changeover === 'yes'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.can_reach_changeover === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.can_reach_changeover === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">Yes - Vehicle can reach a changeover point</span>
                      <p className="text-sm text-gray-300 mt-1">Sufficient charge to reach a depot or changeover location</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('can_reach_changeover', 'no'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.can_reach_changeover === 'no'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.can_reach_changeover === 'no' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.can_reach_changeover === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">No - Vehicle cannot reach a changeover point</span>
                      <p className="text-sm text-gray-300 mt-1">Charge too low to safely reach any depot or changeover location</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onPrevious}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={onNext}
                disabled={!responses.can_reach_changeover}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      // Step 4: Decision
      case 4: {
        const decision = getDecision();
        if (!decision) {
          return (
            <div className="space-y-6">
              <p className="text-white">Unable to determine decision. Please go back and complete the assessment.</p>
              <button onClick={onPrevious} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
                Previous
              </button>
            </div>
          );
        }
        return renderDecision(decision);
      }

      default:
        return null;
    }
  };

  const renderDecision = (decision) => {
    const colorMap = {
      green: {
        bg: 'bg-green-500/20',
        border: 'border-green-400/30',
        text: 'text-green-200',
        textBody: 'text-green-300/90',
        btn: 'bg-green-600 hover:bg-green-500'
      },
      orange: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-400/30',
        text: 'text-orange-200',
        textBody: 'text-orange-300/90',
        btn: 'bg-orange-600 hover:bg-orange-500'
      },
      red: {
        bg: 'bg-red-500/20',
        border: 'border-red-400/30',
        text: 'text-red-200',
        textBody: 'text-red-300/90',
        btn: 'bg-red-600 hover:bg-red-500'
      }
    };

    const colors = colorMap[decision.color];
    const severityEmoji = decision.severity === 'STOP' ? '🛑' : decision.severity === 'AMBER' ? '⚠️' : '✅';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mb-4`}>
            {decision.icon}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{severityEmoji} {decision.title}</h2>
          <p className="text-gray-300">{decision.subtitle}</p>
        </div>

        <div className={`${colors.bg} backdrop-blur-sm rounded-lg p-6 border ${colors.border}`}>
          <div className="flex items-start">
            {decision.icon}
            <div className="flex-1 ml-4">
              <h3 className={`text-xl font-bold ${colors.text} mb-3`}>{severityEmoji} {decision.title}</h3>
              <div className={`${colors.textBody} space-y-2`}>
                <p className="font-semibold">{decision.subtitle}</p>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                  <h4 className={`font-semibold ${colors.text} mb-2`}>Actions Required:</h4>
                  <ul className={`list-disc list-inside space-y-1 ${colors.textBody} text-sm`}>
                    {decision.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {decision.severity === 'STOP' && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="text-sm text-red-300">
                <p className="font-semibold">Safety Notice:</p>
                <p>The vehicle must not continue in service. Arrange passenger transfer and recovery immediately.</p>
              </div>
            </div>
          </div>
        )}

        {decision.severity !== 'STOP' && decision.severity !== 'CONTINUE' && (
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="font-semibold text-blue-200">Engineering Notification</h4>
                <p className="text-sm text-blue-300/90 mt-1">
                  Ensure engineering is notified of the incoming vehicle so it can be prioritised for recharging.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={onPrevious}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => onComplete(decision.severity, decision.notes)}
            className={`px-6 py-3 ${colors.btn} text-white rounded-lg transition-colors`}
          >
            Complete Assessment
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStep()}
    </div>
  );
}

export default EVLowChargeWizard;
