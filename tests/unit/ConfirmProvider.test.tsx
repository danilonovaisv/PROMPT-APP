import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider } from '@/context/ConfirmProvider';
import { useConfirm } from '@/hooks/useConfirm';

function ConfirmHarness() {
  const confirm = useConfirm();

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          await confirm({ message: 'Remover item?' });
        }}
      >
        Abrir confirmacao
      </button>
      <button type="button">Outro foco externo</button>
    </div>
  );
}

describe('ConfirmProvider', () => {
  test('traps focus and closes on escape', async () => {
    const user = userEvent.setup();

    render(
      <ConfirmProvider>
        <ConfirmHarness />
      </ConfirmProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Abrir confirmacao' }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

    expect(confirmButton).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.tab();
    expect(confirmButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir confirmacao' })).toHaveFocus();
  });
});
