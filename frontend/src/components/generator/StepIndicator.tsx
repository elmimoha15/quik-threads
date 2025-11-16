interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: 'Topic or Idea' },
    { number: 2, title: 'Content Source' },
    { number: 3, title: 'Customize Output' }
  ];

  return (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center gap-6">
        {steps.map((step, index) => (
          <div key={step.number}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all text-white`} style={{
                background: currentStep === step.number ? 'var(--gradient-primary)' : 'var(--text-muted)'
              }}>
                {step.number}
              </div>
              <div>
                <p className={`font-semibold text-lg`} style={{
                  color: currentStep === step.number ? 'var(--text-primary)' : 'var(--text-muted)'
                }}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="w-20 h-1 rounded-full ml-16 mt-4" style={{ backgroundColor: 'var(--card-border)' }}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
