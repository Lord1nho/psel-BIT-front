// Limites e validações dos campos de texto. O servidor é quem garante as regras; aqui evitamos enviar
// o que ele rejeitaria (ou, pior, o que quebra com erro 500) e damos retorno imediato ao usuário.
export const TITLE_MAX = 255 // mesmo limite da API
export const DESCRIPTION_MAX = 3500 // mesmo limite da API
export const SEARCH_MAX = 100 // mesmo limite da API para `q`
export const LOGIN_MAX = 255

// Caracteres de controle (exceto tab e quebras de linha): o nulo (\u0000), por exemplo, faz o servidor responder 500
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const cleanText = (s) => s.replace(CONTROL_CHARS, '')
// Campos de uma linha (assunto, busca): também não aceitam tab nem quebra de linha
export const cleanLine = (s) => cleanText(s).replace(/[\t\r\n]+/g, ' ')

export function validateRequest({ title, categoryId, description }) {
  const errors = {}
  const t = title.trim()
  const d = description.trim()
  if (!t) errors.title = 'Informe o assunto da solicitação.'
  else if (t.length > TITLE_MAX) errors.title = `O assunto deve ter no máximo ${TITLE_MAX} caracteres.`
  if (!categoryId) errors.categoryId = 'Selecione uma categoria.'
  if (!d) errors.description = 'Descreva a solicitação.'
  else if (d.length > DESCRIPTION_MAX) errors.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`
  return errors
}

// Valores que chegam pela URL (links do dashboard, favoritos) também passam por validação,
// para não gerarem erro 400 da API
export const searchFromUrl = (s) => cleanLine(s || '').slice(0, SEARCH_MAX)
export const idFromUrl = (s) => (/^\d{1,9}$/.test(s || '') ? s : '')
// data real no formato AAAA-MM-DD (2026-13-99 tem o formato, mas não existe)
export const dateFromUrl = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return ''
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : ''
}

export const COMMENT_MAX = 2000 // mesmo limite da API

export function validateComment(text) {
  const t = text.trim()
  if (!t) return 'Escreva uma mensagem.'
  if (t.length > COMMENT_MAX) return `O comentário deve ter no máximo ${COMMENT_MAX} caracteres.`
  return ''
}
