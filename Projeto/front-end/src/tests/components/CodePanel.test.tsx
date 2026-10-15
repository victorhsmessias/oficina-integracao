import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodePanel } from '../../components/CodePanel';

const CODE = 'programa\n{\n\tfuncao inicio()\n\t{\n\t\tandarParaFrente()\n\t}\n}';

describe('CodePanel', () => {
  it('shows the generated code and the language', () => {
    render(<CodePanel code={CODE} language="Portugol" isEmpty={false} />);

    expect(screen.getByRole('heading', { name: 'Código em Portugol' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código Portugol gerado')).toHaveTextContent('andarParaFrente()');
  });

  it('shows a friendly message and disables copying when there are no blocks', () => {
    render(<CodePanel code={CODE} language="Portugol" isEmpty />);

    expect(screen.getByText(/arraste blocos/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Código Portugol gerado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeDisabled();
  });

  it('copies the code to the clipboard and shows feedback', async () => {
    const user = userEvent.setup();
    render(<CodePanel code={CODE} language="Portugol" isEmpty={false} />);

    await user.click(screen.getByRole('button', { name: 'Copiar código' }));

    await expect(navigator.clipboard.readText()).resolves.toBe(CODE);
    expect(screen.getByRole('button', { name: /copiado/i })).toBeInTheDocument();
    expect(screen.getByText('Código copiado para a área de transferência.')).toBeInTheDocument();
  });

  it('restores the copy button label after a while', async () => {
    const user = userEvent.setup();
    render(<CodePanel code={CODE} language="Portugol" isEmpty={false} feedbackMs={50} />);

    await user.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(screen.getByRole('button', { name: /copiado/i })).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument(),
    );
  });

  it('tells the user when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    render(<CodePanel code={CODE} language="Portugol" isEmpty={false} />);

    await user.click(screen.getByRole('button', { name: 'Copiar código' }));

    expect(screen.getByRole('button', { name: 'Não foi possível copiar' })).toBeInTheDocument();
  });
});
