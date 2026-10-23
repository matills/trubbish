import { Law } from '@trubbish/shared'
import { buildLetter, dueDate } from './letters'

const base = {
  fullName: 'Ana Pérez',
  email: 'ana@ejemplo.com',
  serviceName: 'Despegar',
  serviceDomain: 'despegar.com.ar',
  date: new Date('2026-10-23T12:00:00'),
}

describe('dueDate', () => {
  it('cuenta 5 días hábiles para la Ley 25.326 salteando el fin de semana', () => {
    // viernes 23/10 → viernes 30/10
    expect(dueDate(Law.AR_25326, new Date('2026-10-23T12:00:00')).getDate()).toBe(30)
  })

  it('da un mes para el RGPD', () => {
    const due = dueDate(Law.GDPR, new Date('2026-10-23T12:00:00'))
    expect(due.getMonth()).toBe(10)
    expect(due.getDate()).toBe(23)
  })
})

describe('buildLetter', () => {
  it('arma la carta argentina con el artículo 16 y el DNI si se informa', () => {
    const letter = buildLetter({ ...base, law: Law.AR_25326, documentId: '30111222' })
    expect(letter.subject).toContain('Ley 25.326')
    expect(letter.body).toContain('artículo 16')
    expect(letter.body).toContain('DNI 30111222')
    expect(letter.body).toContain('ana@ejemplo.com')
    expect(letter.body).toContain('Despegar (despegar.com.ar)')
  })

  it('omite el DNI si no se informa', () => {
    expect(buildLetter({ ...base, law: Law.AR_25326 }).body).not.toContain('DNI')
  })

  it('arma la carta RGPD en inglés con el artículo 17', () => {
    const letter = buildLetter({ ...base, law: Law.GDPR })
    expect(letter.subject).toContain('Article 17')
    expect(letter.body).toContain('one month')
  })
})
