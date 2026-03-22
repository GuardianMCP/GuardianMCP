import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const steps = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Install CLI' },
  { id: 2, label: 'Register Server' },
  { id: 3, label: 'Run Scan' },
  { id: 4, label: 'Done' },
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition',
              i < currentStep
                ? 'bg-cyan-600 text-white'
                : i === currentStep
                  ? 'border-2 border-cyan-400 text-cyan-400'
                  : 'border border-slate-600 text-slate-500',
            )}
          >
            {i < currentStep ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'hidden h-0.5 w-8 sm:block',
                i < currentStep ? 'bg-cyan-600' : 'bg-slate-700',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
        <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">Welcome to GuardianMCP</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Let&apos;s get your MCP security scanning set up in just a few steps. You&apos;ll have your
        first scan results in minutes.
      </p>
    </div>
  );
}

function InstallCliStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white">Install the CLI</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Install the GuardianMCP CLI tool to scan your MCP servers from the command line.
      </p>
      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-left">
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="p-4">
          <p className="font-mono text-sm text-slate-300">
            <span className="text-green-400">$</span> npm install -g guardianmcp
          </p>
          <p className="mt-3 font-mono text-sm text-slate-300">
            <span className="text-green-400">$</span> guardianmcp --version
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">guardianmcp v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function RegisterServerStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white">Register a Server</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Register your first MCP server so we can track its security posture.
      </p>
      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-left">
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="p-4">
          <p className="font-mono text-sm text-slate-300">
            <span className="text-green-400">$</span> guardianmcp init
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            ? Server name: <span className="text-white">my-mcp-server</span>
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500">
            ? Language: <span className="text-white">TypeScript</span>
          </p>
          <p className="mt-1 font-mono text-xs text-green-400">
            Server registered successfully!
          </p>
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
        Or add a server from the{' '}
        <span className="text-cyan-400">Servers</span> page in the dashboard.
      </p>
    </div>
  );
}

function RunScanStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white">Run Your First Scan</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Scan your MCP server project directory to detect security issues.
      </p>
      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-left">
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="p-4">
          <p className="font-mono text-sm text-slate-300">
            <span className="text-green-400">$</span> guardianmcp scan .
          </p>
          <p className="mt-2 font-mono text-xs text-slate-500">Scanning 18 files...</p>
          <p className="mt-1 font-mono text-xs text-cyan-400">
            Checking 10 OWASP rules...
          </p>
          <p className="mt-2 font-mono text-xs text-slate-400">
            Found <span className="text-yellow-400">3</span> findings
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            Security Score: <span className="text-green-400">85/100</span>
          </p>
          <p className="mt-2 font-mono text-xs text-green-400">
            Results uploaded to dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">You&apos;re All Set!</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Your GuardianMCP environment is ready. Head to the dashboard to explore your scan results and
        manage your MCP server security.
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      navigate('/dashboard');
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-2xl space-y-10">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step Content */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 px-8 py-12 shadow-lg">
          {currentStep === 0 && <WelcomeStep />}
          {currentStep === 1 && <InstallCliStep />}
          {currentStep === 2 && <RegisterServerStep />}
          {currentStep === 3 && <RunScanStep />}
          {currentStep === 4 && <DoneStep />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            Skip setup
          </button>
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              {isLastStep ? 'Go to Dashboard' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
