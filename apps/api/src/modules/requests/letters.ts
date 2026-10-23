import { Law } from '@borrar/shared'

export interface LetterInput {
  law: Law
  fullName: string
  documentId?: string
  email: string
  serviceName: string
  serviceDomain: string
  date: Date
}

export interface Letter {
  subject: string
  body: string
}

/** Ley 25.326, art. 16: 5 días hábiles. RGPD, art. 12.3: un mes. */
export function dueDate(law: Law, from: Date): Date {
  if (law === Law.GDPR) {
    const due = new Date(from)
    due.setMonth(due.getMonth() + 1)
    return due
  }
  const due = new Date(from)
  let businessDays = 0
  while (businessDays < 5) {
    due.setDate(due.getDate() + 1)
    const day = due.getDay()
    if (day !== 0 && day !== 6) businessDays++
  }
  return due
}

const formatEs = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
const formatEn = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function buildLetter(input: LetterInput): Letter {
  return input.law === Law.GDPR ? gdprLetter(input) : arLetter(input)
}

function arLetter(i: LetterInput): Letter {
  const id = i.documentId ? `, DNI ${i.documentId}` : ''
  return {
    subject: `Solicitud de supresión de datos personales — Ley 25.326`,
    body: [
      formatEs(i.date),
      '',
      `A: ${i.serviceName} (${i.serviceDomain})`,
      'Responsable de protección de datos personales',
      '',
      `Quien suscribe, ${i.fullName}${id}, titular de la cuenta asociada al correo ${i.email}, ejerce el derecho de supresión previsto en el artículo 16 de la Ley 25.326 de Protección de los Datos Personales y en el artículo 43 de la Constitución Nacional.`,
      '',
      'Solicito:',
      '1. La eliminación de mi cuenta y de todos los datos personales que me conciernen y obren en sus bases de datos.',
      '2. La confirmación por escrito de la supresión una vez realizada.',
      '3. En caso de que deban conservar algún dato por obligación legal, que me informen cuál, con qué fundamento y por cuánto tiempo, y que lo bloqueen para cualquier otro uso.',
      '',
      'Les recuerdo que el artículo 16 de la ley establece un plazo de cinco (5) días hábiles para cumplir con esta solicitud. Vencido ese plazo sin respuesta, podré iniciar la acción de protección de datos personales o presentar una denuncia ante la Agencia de Acceso a la Información Pública (AAIP).',
      '',
      `Acredito mi identidad mediante el envío de esta solicitud desde el correo registrado en la cuenta${i.documentId ? ' y con el número de documento indicado' : ''}.`,
      '',
      'Saludo atentamente,',
      i.fullName,
      i.email,
    ].join('\n'),
  }
}

function gdprLetter(i: LetterInput): Letter {
  return {
    subject: 'Erasure request under Article 17 GDPR',
    body: [
      formatEn(i.date),
      '',
      `To: ${i.serviceName} (${i.serviceDomain})`,
      'Data Protection Officer',
      '',
      `I, ${i.fullName}, holder of the account registered with the email address ${i.email}, hereby request the erasure of all personal data concerning me, pursuant to Article 17 of the General Data Protection Regulation (EU) 2016/679.`,
      '',
      'Please:',
      '1. Delete my account and all personal data you hold about me, including data shared with processors and third parties (Article 19).',
      '2. Confirm in writing once the erasure has been completed.',
      '3. If you are legally required to retain any data, specify which data, the legal basis and the retention period.',
      '',
      'Under Article 12(3) GDPR you must respond without undue delay and in any event within one month of receipt of this request. If I do not receive a response within that period, I will lodge a complaint with the competent supervisory authority.',
      '',
      'I am sending this request from the email address registered with the account to verify my identity.',
      '',
      'Kind regards,',
      i.fullName,
      i.email,
    ].join('\n'),
  }
}
