/**
 * returns first lang having given langage code from data locales
 * @param {ServiceBase} service a service
 * @param {string} langCode langage code
 */
function getLangWithLangCode(service, langCode) {
    let locales = data(this).locales
    if (locales == null) return null;
    for (let locale in locales) {
        if (locale.locale.startsWith(langCode))
            return locale
    }
    return null
}

/**
 * returns first lang having given country code from data locales
 * @param {ServiceBase} service a service
 * @param {string} countryCode country code
 */
function getLangWithCountryCode(service, countryCode) {
    let locales = data(service).locales
    if (locales == null) return null;
    for (let langCode in locales) {
        let locale = locales[langCode]
        if (locale.locale.endsWith(countryCode))
            return locale
    }
    return null
}