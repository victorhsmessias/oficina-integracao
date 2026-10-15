import { useMemo, useState } from 'react';
import { emptyProgram, isEmptyProgram, type Program } from '../ast';
import { AppHeader } from '../components/AppHeader';
import { BlocklyEditor } from '../components/BlocklyEditor';
import { CodePanel } from '../components/CodePanel';
import { codeGenerator, type CodeGenerator } from '../generators';

interface EditorPageProps {
  generator?: CodeGenerator;
}

export function EditorPage({ generator = codeGenerator }: EditorPageProps) {
  const [program, setProgram] = useState<Program>(emptyProgram);
  const code = useMemo(() => generator.generate(program), [generator, program]);

  return (
    <div className="editor-page">
      <AppHeader />
      <main className="editor-layout">
        <section className="editor-layout__blocks" aria-label="Editor de blocos">
          <BlocklyEditor onProgramChange={setProgram} />
        </section>
        <aside className="editor-layout__code">
          <CodePanel code={code} language={generator.language} isEmpty={isEmptyProgram(program)} />
        </aside>
      </main>
    </div>
  );
}
