export class PgClientExecutor {
    #client;
    constructor(client) {
        this.#client = client;
    }
    async exec(sql) {
        await this.#client.query(sql);
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    async query(sql, params) {
        const result = await this.#client.query(sql, params);
        return { rows: result.rows };
    }
    async transaction(fn) {
        await this.#client.query('BEGIN');
        try {
            const result = await fn(this);
            await this.#client.query('COMMIT');
            return result;
        }
        catch (error) {
            await this.#client.query('ROLLBACK');
            throw error;
        }
    }
}
//# sourceMappingURL=pg-client-executor.js.map