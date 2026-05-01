export const getSiteInfo = async (api, siteId, cachedConfig) => {
    const { siteInfo: cachedSiteInfo } = cachedConfig;
    if (siteId !== cachedSiteInfo.id) {
        return (await api.getSite({ siteId }));
    }
    return cachedSiteInfo;
};
//# sourceMappingURL=utils.js.map