import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPreviewModal } from '@/components/editor/EditorPreviewModal';

const payload = {
  version: '1.0.0',
  prompt: 'prompt',
  metadata: {},
} as unknown;

describe('EditorPreviewModal', () => {
  test('traps focus and closes on escape', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <EditorPreviewModal
        isOpen
        renderedPrompt="Prompt final"
        payload={payload as never}
        error={null}
        onClose={onClose}
        onCopy={jest.fn().mockResolvedValue(undefined)}
        onDownload={jest.fn()}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Fechar preview' });
    await screen.findByRole('dialog');
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /copiar prompt/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /baixar \.json/i })).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
