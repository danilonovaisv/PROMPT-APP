export const readApiErrorMessage = async (response) => {
    const text = await response.text();
    if (!text) {
        return '';
    }
    try {
        const body = JSON.parse(text);
        if (typeof body.message === 'string' && body.message.trim()) {
            return body.message;
        }
    }
    catch {
        // body is not JSON; fall through to raw text
    }
    return text;
};
//# sourceMappingURL=api-errors.js.map