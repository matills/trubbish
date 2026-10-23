---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features. Provides comprehensive security checklist and patterns.
origin: ECC
---

# Skill de Security Review

Este skill asegura que todo el código siga best practices de seguridad e identifica vulnerabilidades potenciales.

## Cuándo activarlo

- Al implementar autenticación o autorización
- Al manejar input de usuario o uploads de archivos
- Al crear endpoints de API nuevos
- Al trabajar con secrets o credenciales
- Al implementar features de pagos
- Al guardar o transmitir datos sensibles
- Al integrar APIs de terceros

## Checklist de seguridad

### 1. Manejo de secrets

#### FAIL: NUNCA hacer esto
```typescript
const apiKey = "sk-proj-xxxxx"  // Secret hardcodeado
const dbPassword = "password123" // En el código fuente
```

#### PASS: SIEMPRE hacer esto
```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// Verificar que los secrets existan
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

#### Pasos de verificación
- [ ] Sin API keys, tokens, o contraseñas hardcodeadas
- [ ] Todos los secrets en variables de entorno
- [ ] `.env.local` en .gitignore
- [ ] Sin secrets en el historial de git
- [ ] Secrets de producción en la plataforma de hosting (Vercel, Railway)

### 2. Validación de inputs

#### Siempre validar el input de usuario
```typescript
import { z } from 'zod'

// Definir el esquema de validación
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// Validar antes de procesar
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### Validación de upload de archivos
```typescript
function validateFileUpload(file: File) {
  // Chequeo de tamaño (5MB máx)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  // Chequeo de tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // Chequeo de extensión
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

#### Pasos de verificación
- [ ] Todos los inputs de usuario validados con esquemas
- [ ] Uploads de archivos restringidos (tamaño, tipo, extensión)
- [ ] Sin uso directo de input de usuario en queries
- [ ] Validación por whitelist (no blacklist)
- [ ] Los mensajes de error no filtran info sensible

### 3. Prevención de SQL Injection

#### FAIL: NUNCA concatenar SQL
```typescript
// PELIGROSO - vulnerabilidad de SQL Injection
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### PASS: SIEMPRE usar queries parametrizadas
```typescript
// Seguro - query parametrizada
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// O con SQL crudo
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

#### Pasos de verificación
- [ ] Todas las queries de base de datos usan queries parametrizadas
- [ ] Sin concatenación de strings en SQL
- [ ] ORM/query builder usado correctamente
- [ ] Queries de Supabase sanitizadas apropiadamente

### 4. Autenticación y Autorización

#### Manejo de token JWT
```typescript
// FAIL: INCORRECTO: localStorage (vulnerable a XSS)
localStorage.setItem('token', token)

// PASS: CORRECTO: cookies httpOnly
res.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

#### Chequeos de autorización
```typescript
export async function deleteUser(userId: string, requesterId: string) {
  // SIEMPRE verificar la autorización primero
  const requester = await db.users.findUnique({
    where: { id: requesterId }
  })

  if (requester.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  // Proceder con la eliminación
  await db.users.delete({ where: { id: userId } })
}
```

#### Row Level Security (Supabase)
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios datos
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios solo pueden actualizar sus propios datos
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### Pasos de verificación
- [ ] Tokens guardados en cookies httpOnly (no localStorage)
- [ ] Chequeos de autorización antes de operaciones sensibles
- [ ] Row Level Security habilitado en Supabase
- [ ] Role-based access control implementado
- [ ] Manejo de sesión seguro

### 5. Prevención de XSS

#### Sanitizar HTML
```typescript
import DOMPurify from 'isomorphic-dompurify'

// SIEMPRE sanitizar HTML provisto por el usuario
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### Content Security Policy

Empezar estricto y aflojar solo con un plan de remoción documentado. No usar
por defecto `'unsafe-inline'` o `'unsafe-eval'`; neutralizan buena parte de la
protección de CSP y deben tratarse como deuda de compatibilidad temporal.

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      script-src 'self';
      style-src 'self';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

#### Pasos de verificación
- [ ] HTML provisto por el usuario sanitizado
- [ ] Headers de CSP configurados
- [ ] Sin renderizado de contenido dinámico sin validar
- [ ] Se usa la protección XSS incorporada de React

### 6. Protección CSRF

#### Tokens CSRF
```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')

  if (!csrf.verify(token)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Procesar el request
}
```

#### Cookies SameSite
```typescript
res.setHeader('Set-Cookie',
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`)
```

#### Pasos de verificación
- [ ] Tokens CSRF en operaciones que cambian estado
- [ ] SameSite=Strict en todas las cookies
- [ ] Patrón double-submit cookie implementado

### 7. Rate Limiting

#### Rate Limiting de API
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Too many requests'
})

// Aplicar a las rutas
app.use('/api/', limiter)
```

#### Operaciones costosas
```typescript
// Rate limiting agresivo para búsquedas
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: 'Too many search requests'
})

app.use('/api/search', searchLimiter)
```

#### Pasos de verificación
- [ ] Rate limiting en todos los endpoints de API
- [ ] Límites más estrictos en operaciones costosas
- [ ] Rate limiting basado en IP
- [ ] Rate limiting basado en usuario (autenticado)

### 8. Exposición de datos sensibles

#### Logging
```typescript
// FAIL: INCORRECTO: loguear datos sensibles
console.log('User login:', { email, password })
console.log('Payment:', { cardNumber, cvv })

// PASS: CORRECTO: redactar datos sensibles
console.log('User login:', { email, userId })
console.log('Payment:', { last4: card.last4, userId })
```

#### Mensajes de error
```typescript
// FAIL: INCORRECTO: exponer detalles internos
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// PASS: CORRECTO: mensajes de error genéricos
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

#### Pasos de verificación
- [ ] Sin contraseñas, tokens, o secrets en los logs
- [ ] Mensajes de error genéricos para los usuarios
- [ ] Errores detallados solo en los logs del servidor
- [ ] Sin stack traces expuestos a los usuarios

### 9. Seguridad de Blockchain (Solana)

#### Verificación de wallet
```typescript
import { verify } from '@solana/web3.js'

async function verifyWalletOwnership(
  publicKey: string,
  signature: string,
  message: string
) {
  try {
    const isValid = verify(
      Buffer.from(message),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    )
    return isValid
  } catch (error) {
    return false
  }
}
```

#### Verificación de transacción
```typescript
async function verifyTransaction(transaction: Transaction) {
  // Verificar el destinatario
  if (transaction.to !== expectedRecipient) {
    throw new Error('Invalid recipient')
  }

  // Verificar el monto
  if (transaction.amount > maxAmount) {
    throw new Error('Amount exceeds limit')
  }

  // Verificar que el usuario tenga balance suficiente
  const balance = await getBalance(transaction.from)
  if (balance < transaction.amount) {
    throw new Error('Insufficient balance')
  }

  return true
}
```

#### Pasos de verificación
- [ ] Firmas de wallet verificadas
- [ ] Detalles de transacción validados
- [ ] Chequeos de balance antes de las transacciones
- [ ] Sin firma ciega de transacciones

### 10. Seguridad de dependencias

#### Actualizaciones regulares
```bash
# Chequear vulnerabilidades
npm audit

# Corregir automáticamente lo que se pueda
npm audit fix

# Actualizar dependencias
npm update

# Chequear paquetes desactualizados
npm outdated
```

#### Lock Files
```bash
# SIEMPRE commitear los lock files
git add package-lock.json

# Usar en CI/CD para builds reproducibles
npm ci  # En vez de npm install
```

#### Pasos de verificación
- [ ] Dependencias actualizadas
- [ ] Sin vulnerabilidades conocidas (npm audit limpio)
- [ ] Lock files commiteados
- [ ] Dependabot habilitado en GitHub
- [ ] Actualizaciones de seguridad regulares

## Testing de seguridad

### Tests de seguridad automatizados
```typescript
// Testear autenticación
test('requires authentication', async () => {
  const response = await fetch('/api/protected')
  expect(response.status).toBe(401)
})

// Testear autorización
test('requires admin role', async () => {
  const response = await fetch('/api/admin', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(response.status).toBe(403)
})

// Testear validación de input
test('rejects invalid input', async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' })
  })
  expect(response.status).toBe(400)
})

// Testear rate limiting
test('enforces rate limits', async () => {
  const requests = Array(101).fill(null).map(() =>
    fetch('/api/endpoint')
  )

  const responses = await Promise.all(requests)
  const tooManyRequests = responses.filter(r => r.status === 429)

  expect(tooManyRequests.length).toBeGreaterThan(0)
})
```

## Checklist de seguridad pre-deployment

Antes de CUALQUIER deployment de producción:

- [ ] **Secrets**: sin secrets hardcodeados, todos en env vars
- [ ] **Validación de input**: todos los inputs de usuario validados
- [ ] **SQL Injection**: todas las queries parametrizadas
- [ ] **XSS**: contenido de usuario sanitizado
- [ ] **CSRF**: protección habilitada
- [ ] **Autenticación**: manejo de token apropiado
- [ ] **Autorización**: chequeos de rol implementados
- [ ] **Rate Limiting**: habilitado en todos los endpoints
- [ ] **HTTPS**: forzado en producción
- [ ] **Security Headers**: CSP, X-Frame-Options configurados
- [ ] **Manejo de errores**: sin datos sensibles en los errores
- [ ] **Logging**: sin datos sensibles logueados
- [ ] **Dependencias**: actualizadas, sin vulnerabilidades
- [ ] **Row Level Security**: habilitado en Supabase
- [ ] **CORS**: configurado apropiadamente
- [ ] **Uploads de archivos**: validados (tamaño, tipo)
- [ ] **Firmas de wallet**: verificadas (si aplica blockchain)

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Recordá**: la seguridad no es opcional. Una vulnerabilidad puede comprometer toda la plataforma. Ante la duda, priorizá la cautela.
