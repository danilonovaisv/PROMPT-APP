import { getDuplicateIds, getMissingSeedRecords } from '@/db/seedHelpers';

describe('getMissingSeedRecords', () => {
  test('retorna apenas registros ainda ausentes', () => {
    const missing = getMissingSeedRecords(
      [
        { key: 'copy' },
        { key: 'code' },
      ],
      [{ key: 'copy' }],
      (item) => item.key
    );

    expect(missing).toEqual([{ key: 'code' }]);
  });
});

describe('getDuplicateIds', () => {
  test('identifica duplicatas preservando apenas a primeira ocorrência', () => {
    const duplicates = getDuplicateIds(
      [
        { id: 1, key: 'tom' },
        { id: 2, key: 'tom' },
        { id: 3, key: 'publico' },
        { id: 4, key: 'tom' },
      ],
      (item) => item.key,
      (item) => item.id
    );

    expect(duplicates).toEqual([2, 4]);
  });
});
