export async function withRetry<T>(
  fn: () => Promise<T> | PromiseLike<T>,
  retries = 3,
  backoff = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((res) => setTimeout(res, backoff));
    return withRetry(fn, retries - 1, backoff * 2);
  }
}

/** 
 * Busca todas as páginas de uma tabela usando paginação por range (1 000 linhas/página). 
 * Reutilizável em todos os handlers de download.
 */
export async function fetchAllPages<T>(
  query: (range: [number, number]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
   
  while (true) {
    const { data, error } = await query([from, from + pageSize - 1]);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break; // última página
    from += pageSize;
  }
  return all;
}
