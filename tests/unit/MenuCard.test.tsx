import { jest } from "@jest/globals";
import { render, screen } from '@testing-library/react';
import { MenuCard } from '@/components/menu-manager/MenuCard';

describe('MenuCard', () => {
  test('renderiza sem quebrar quando options/subOptions chegam em formato legado inválido', () => {
    const baseDate = new Date('2026-03-26T00:00:00.000Z');

    expect(() =>
      render(
        <MenuCard
          menu={{
            menuId: 'tom',
            menuName: 'Tom',
            description: 'Define o tom',
            selectionMode: 'single',
            options: {
              label: 'Formal',
              value: 'formal',
              subOptions: { label: 'Corporativo', value: 'corporativo' },
            } as unknown as never,
            createdAt: baseDate,
            updatedAt: baseDate,
          }}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
      ),
    ).not.toThrow();

    expect(screen.getByText('Formal')).toBeInTheDocument();
    expect(screen.getByText('Corporativo')).toBeInTheDocument();
  });
});
