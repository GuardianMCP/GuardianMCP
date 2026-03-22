import { Link } from 'react-router-dom';

const features = [
  {
    title: '10 OWASP Rules',
    description:
      'Comprehensive coverage of the OWASP top security risks tailored for MCP server environments.',
    icon: (
      <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'CLI + Dashboard',
    description:
      'Scan from the command line and visualize results in a real-time web dashboard.',
    icon: (
      <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Real-time Scanning',
    description:
      'Stream scan results as they happen with live progress tracking and severity breakdowns.',
    icon: (
      <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-white">GuardianMCP</span>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          Guardian<span className="text-cyan-400">MCP</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Security scanner for MCP servers. Detect vulnerabilities, enforce best practices, and
          keep your Model Context Protocol infrastructure safe.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/register"
            className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            Get Started Free
          </Link>
          <a
            href="#cli"
            className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            View CLI
          </a>
        </div>

        {/* Terminal block */}
        <div
          id="cli"
          className="mx-auto mt-16 max-w-xl overflow-hidden rounded-xl border border-slate-700 bg-slate-800 text-left shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-slate-500">terminal</span>
          </div>
          <div className="p-5">
            <p className="font-mono text-sm text-slate-300">
              <span className="text-green-400">$</span> npx guardianmcp scan .
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500">
              Scanning 24 files across 3 MCP servers...
            </p>
            <p className="mt-1 font-mono text-xs text-red-400">
              CRITICAL  2 findings &middot; insecure tool invocation
            </p>
            <p className="mt-0.5 font-mono text-xs text-orange-400">
              HIGH      4 findings &middot; missing input validation
            </p>
            <p className="mt-0.5 font-mono text-xs text-yellow-400">
              MEDIUM    7 findings &middot; excessive permissions
            </p>
            <p className="mt-0.5 font-mono text-xs text-blue-400">
              LOW       3 findings &middot; informational
            </p>
            <p className="mt-3 font-mono text-xs text-slate-400">
              Security Score: <span className="text-yellow-400">62/100</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">
            Built for MCP Security
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Purpose-built security tooling for the Model Context Protocol ecosystem.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 transition hover:border-slate-600"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <p className="text-center text-xs text-slate-500">
          GuardianMCP &mdash; Open-source MCP security scanner
        </p>
      </footer>
    </div>
  );
}
