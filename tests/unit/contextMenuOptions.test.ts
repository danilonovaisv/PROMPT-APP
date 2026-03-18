import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';

describe('normalizeContextMenuOptions', () => {
  test('mantém opções válidas e normaliza subOptions', () => {
    const normalized = normalizeContextMenuOptions([
      {
        label: 'Formal',
        value: 'formal',
        subOptions: [
          { label: 'Corporativo', value: 'corporativo' },
          { label: 'Executivo', value: 'executivo', description: 'ignorado' },
        ],
      },
    ]);

    expect(normalized).toEqual([
      {
        label: 'Formal',
        value: 'formal',
        subOptions: [
          { label: 'Corporativo', value: 'corporativo' },
          { label: 'Executivo', value: 'executivo' },
        ],
      },
    ]);
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['string', 'invalid'],
  ])('retorna array vazio quando options é %s', (_label, value) => {
    expect(normalizeContextMenuOptions(value)).toEqual([]);
  });

  test('converte objeto único em array compatível', () => {
    const normalized = normalizeContextMenuOptions({
      label: 'Formal',
      value: 'formal',
      sub_options: { label: 'Corporativo', value: 'corporativo' },
    });

    expect(normalized).toEqual([
      {
        label: 'Formal',
        value: 'formal',
        subOptions: [{ label: 'Corporativo', value: 'corporativo' }],
      },
    ]);
  });

  test('suporta sub_options e remove entradas inválidas', () => {
    const normalized = normalizeContextMenuOptions([
      {
        label: 'Formal',
        value: 'formal',
        sub_options: [
          { label: 'Corporativo', value: 'corporativo' },
          { label: '', value: 'vazio' },
          'invalid',
        ],
      },
      {
        label: '',
        value: 'sem-label',
      },
    ]);

    expect(normalized).toEqual([
      {
        label: 'Formal',
        value: 'formal',
        subOptions: [{ label: 'Corporativo', value: 'corporativo' }],
      },
    ]);
  });
});
