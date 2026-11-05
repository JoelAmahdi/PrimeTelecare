import React from 'react';
import { Check } from 'lucide-react';

export type BookingStep = 1 | 2 | 3 | 4;

interface BookingProgressTrackerProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
  providerName?: string;
  selectedDateTime?: string;
}

export const BookingProgressTracker: React.FC<BookingProgressTrackerProps> = ({
  currentStep,
  onStepClick,
}) => {
  const steps = [
    { id: 1 as BookingStep, label: 'Doctor' },
    { id: 2 as BookingStep, label: 'Schedule' },
    { id: 3 as BookingStep, label: 'Details' },
    { id: 4 as BookingStep, label: 'Payment' },
  ];

  const currentLabel = steps.find((s) => s.id === currentStep)?.label || 'Payment';

  return (
    <div className="bg-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-500 font-nunito">
          Step {currentStep} of 4
        </span>
        <span className="text-xs font-bold text-[#0f172a] font-outfit">
          {currentLabel}
        </span>
      </div>

      {/* Apple-style Segmented Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep || !onStepClick}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : isActive
                  ? 'bg-[#0f172a]'
                  : 'bg-slate-200 cursor-default'
              }`}
              title={`Step ${step.id}: ${step.label}`}
            />
          );
        })}
      </div>

      {/* Step names (subtle, clean, unboxed) */}
      <div className="grid grid-cols-4 gap-1 mt-2 text-center">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep || !onStepClick}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-[#0f172a] font-semibold'
                  : isCompleted
                  ? 'text-emerald-700 hover:text-emerald-800 cursor-pointer'
                  : 'text-slate-400 cursor-default'
              }`}
            >
              {isCompleted ? (
                <span className="inline-flex items-center space-x-0.5">
                  <Check className="w-2.5 h-2.5 inline stroke-[2.5]" />
                  <span>{step.label}</span>
                </span>
              ) : (
                step.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
