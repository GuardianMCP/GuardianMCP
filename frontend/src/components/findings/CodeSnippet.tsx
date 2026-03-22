import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { cn } from '@/lib/utils';

interface CodeSnippetProps {
  code: string;
  language?: string;
  startLine?: number;
  highlightLine?: number;
  className?: string;
}

export function CodeSnippet({
  code,
  language = 'javascript',
  startLine = 1,
  highlightLine,
  className,
}: CodeSnippetProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-lg border border-slate-700 bg-slate-950',
        className,
      )}
    >
      <div className="flex text-xs">
        {/* Line numbers */}
        <div className="flex flex-col border-r border-slate-700 bg-slate-900/50 px-3 py-3 text-right font-mono text-slate-500 select-none">
          {lines.map((_, i) => (
            <span
              key={i}
              className={cn(
                'leading-5',
                highlightLine === startLine + i && 'text-red-400 font-bold',
              )}
            >
              {startLine + i}
            </span>
          ))}
        </div>

        {/* Code content */}
        <div className="flex-1 overflow-x-auto p-3">
          <pre className="!m-0 !bg-transparent !p-0">
            <code
              ref={codeRef}
              className={`language-${language} !text-xs !leading-5`}
            >
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
