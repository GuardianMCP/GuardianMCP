import { useScanSSE } from '@/hooks/useScanSSE';

interface ScanProgressPanelProps {
  scanId: string;
  onComplete: () => void;
}

const steps = ['cloning', 'scanning', 'processing', 'saving', 'completed'] as const;

const stepLabels: Record<string, string> = {
  cloning: 'Cloning repository',
  scanning: 'Running security scan',
  processing: 'Processing results',
  saving: 'Saving findings',
  completed: 'Scan complete',
  error: 'Scan failed',
};

export default function ScanProgressPanel({ scanId, onComplete }: ScanProgressPanelProps) {
  const { events } = useScanSSE(scanId);

  // Get the latest event
  const latest = events.length > 0 ? events[events.length - 1] : null;
  const latestData = latest?.data as Record<string, unknown> | undefined;
  const currentStep = (latestData?.step as string) ?? 'cloning';
  const progress = (latestData?.progress as number) ?? 0;
  const message = (latestData?.message as string) ?? 'Starting scan...';
  const isError = latest?.type === 'error' || currentStep === 'error';
  const isComplete = currentStep === 'completed';

  // Auto-trigger onComplete when scan finishes
  if (isComplete || isError) {
    setTimeout(onComplete, 2000);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {isError ? 'Scan Failed' : isComplete ? 'Scan Complete' : 'Scanning...'}
        </h3>
        {!isComplete && !isError && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isError
              ? 'bg-red-500'
              : isComplete
                ? 'bg-green-500'
                : 'bg-cyan-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="mb-3 flex items-center gap-1">
        {steps.map((step, i) => {
          const stepIndex = steps.indexOf(currentStep as (typeof steps)[number]);
          const isActive = step === currentStep;
          const isDone = i < stepIndex || isComplete;

          return (
            <div key={step} className="flex flex-1 items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  isActive
                    ? 'bg-cyan-400'
                    : isDone
                      ? 'bg-green-500'
                      : 'bg-slate-600'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive
                    ? 'font-medium text-cyan-400'
                    : isDone
                      ? 'text-green-400'
                      : 'text-slate-500'
                }`}
              >
                {stepLabels[step] ?? step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <p className={`text-sm ${isError ? 'text-red-400' : 'text-slate-400'}`}>
        {message}
      </p>

      {/* Show summary on completion */}
      {isComplete && latestData?.totalFindings !== undefined && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-white">
            Score:{' '}
            <span className="font-bold text-cyan-400">
              {String(latestData.securityScore)}
            </span>
          </span>
          <span className="text-slate-400">
            {String(latestData.totalFindings)} findings
          </span>
        </div>
      )}
    </div>
  );
}
