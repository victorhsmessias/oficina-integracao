import { useEffect, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'error';

interface CodePanelProps {
  code: string;
  language: string;
  isEmpty: boolean;
  feedbackMs?: number;
}

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: 'Copiar código',
  copied: 'Copiado! ✓',
  error: 'Não foi possível copiar',
};

export function CodePanel({ code, language, isEmpty, feedbackMs = 2000 }: CodePanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = setTimeout(() => setCopyStatus('idle'), feedbackMs);
    return () => clearTimeout(timer);
  }, [copyStatus, feedbackMs]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <section className="code-panel" aria-labelledby="code-panel-title">
      <header className="code-panel__header">
        <h2 id="code-panel-title">Código em {language}</h2>
        <button
          type="button"
          className={`button code-panel__copy code-panel__copy--${copyStatus}`}
          onClick={handleCopy}
          disabled={isEmpty}
        >
          {COPY_LABELS[copyStatus]}
        </button>
      </header>

      {isEmpty ? (
        <p className="code-panel__empty">
          Arraste blocos da caixa de ferramentas para montar o seu programa. O código vai aparecer
          aqui! 🤖
        </p>
      ) : (
        <pre className="code-panel__code" aria-label={`Código ${language} gerado`}>
          <code>{code}</code>
        </pre>
      )}

      <span className="visually-hidden" aria-live="polite">
        {copyStatus === 'copied' ? 'Código copiado para a área de transferência.' : ''}
      </span>
    </section>
  );
}
