// FILE: src/lib/app-params.js

const isNode = typeof window === 'undefined'
const windowObj = isNode ? { localStorage: new Map() } : window
const storage = windowObj.localStorage

const APP_PREFIX = 'amapa_turismo' // prefixo próprio do projeto (pode mudar)

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

/**
 * Lê parâmetros da URL e/ou localStorage.
 * - Se existir na URL, salva no storage e retorna.
 * - Se não existir e houver defaultValue, salva e retorna.
 * - Senão tenta pegar do storage.
 */
const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {}
) => {
  if (isNode) return defaultValue

  const storageKey = `${APP_PREFIX}_${toSnakeCase(paramName)}`
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get(paramName)

  // Remove o parâmetro da URL se solicitado (útil p/ segurança e URL limpa)
  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName)
    const newUrl =
      `${window.location.pathname}` +
      `${urlParams.toString() ? `?${urlParams.toString()}` : ''}` +
      `${window.location.hash || ''}`
    window.history.replaceState({}, document.title, newUrl)
  }

  if (searchParam !== null && searchParam !== undefined && searchParam !== '') {
    storage.setItem(storageKey, searchParam)
    return searchParam
  }

  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    storage.setItem(storageKey, defaultValue)
    return defaultValue
  }

  const storedValue = storage.getItem(storageKey)
  if (storedValue !== null && storedValue !== undefined && storedValue !== '') {
    return storedValue
  }

  return null
}

/**
 * Parâmetros gerais do app (sem dependência de Base44).
 * - clear_session=true: força limpeza de sessão (a gente usa no AuthContext)
 * - from_url: origem de navegação
 * - redirect_to: destino pós-login
 */
const getAppParams = () => {
  // Se você quiser forçar logout/limpeza via URL:
  // ex: https://seusite.com?clear_session=true
  const shouldClearSession = getAppParamValue('clear_session', { removeFromUrl: true }) === 'true'

  // URL de origem para usar em redirecionamentos
  const fromUrl =
    getAppParamValue('from_url', {
      defaultValue: window.location.href,
      removeFromUrl: false,
    }) || window.location.href

  // Para onde voltar após login (ex.: quando usuário tenta favoritar e é redirecionado)
  const redirectTo =
    getAppParamValue('redirect_to', {
      defaultValue: window.location.href,
      removeFromUrl: false,
    }) || window.location.href

  // Flags opcionais (se quiser aproveitar em links)
  const initialCity = getAppParamValue('city', { removeFromUrl: false })
  const initialCategory = getAppParamValue('category', { removeFromUrl: false })

  return {
    shouldClearSession,
    fromUrl,
    redirectTo,
    initialCity,
    initialCategory,
  }
}

export const appParams = {
  ...getAppParams(),
}
``