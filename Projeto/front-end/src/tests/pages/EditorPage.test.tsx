import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Program } from '../../ast';
import { AuthProvider } from '../../context/AuthProvider';
import type { CodeGenerator } from '../../generators';
import { EditorPage } from '../../pages/EditorPage';
import { createFakeApi, createMemorySessionStore, testSession } from '../helpers';

const SAMPLE_PROGRAM: Program = {
  type: 'program',
  body: [{ type: 'move', direction: 'forward' }],
};

vi.mock('../../components/BlocklyEditor', () => ({
  BlocklyEditor: ({ onProgramChange }: { onProgramChange(program: Program): void }) => (
    <button onClick={() => onProgramChange(SAMPLE_PROGRAM)}>adicionar bloco</button>
  ),
}));

const fakeGenerator: CodeGenerator = {
  language: 'Linguagem Teste',
  generate: vi.fn((program: Program) => `${program.body.length} comando(s)`),
};

function renderEditor() {
  return render(
    <AuthProvider api={createFakeApi()} sessionStore={createMemorySessionStore(testSession)}>
      <MemoryRouter>
        <EditorPage generator={fakeGenerator} />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('EditorPage', () => {
  it('starts with the empty program message', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: 'Código em Linguagem Teste' })).toBeInTheDocument();
    expect(screen.getByText(/arraste blocos/i)).toBeInTheDocument();
  });

  it('sends the AST emitted by the editor to the generator and shows the result', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'adicionar bloco' }));

    expect(fakeGenerator.generate).toHaveBeenLastCalledWith(SAMPLE_PROGRAM);
    expect(screen.getByLabelText('Código Linguagem Teste gerado')).toHaveTextContent('1 comando(s)');
  });

  it('shows the logged user in the header', async () => {
    renderEditor();

    expect(await screen.findByText(`Olá, ${testSession.user.name}`)).toBeInTheDocument();
  });
});
