---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Estilo de código TypeScript/JavaScript

> Este archivo extiende [common/coding-style.md](../common/coding-style.md) con contenido específico de TypeScript/JavaScript.

## Types e Interfaces

Usar types para que las APIs públicas, modelos compartidos y props de componentes sean explícitos, legibles y reutilizables.

### APIs públicas

- Agregar types de parámetros y retorno a funciones exportadas, utilidades compartidas y métodos públicos de clases
- Dejar que TypeScript infiera los types obvios de variables locales
- Extraer shapes de objetos inline repetidos en types o interfaces con nombre

```typescript
// INCORRECTO: función exportada sin types explícitos
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}

// CORRECTO: types explícitos en APIs públicas
interface User {
  firstName: string
  lastName: string
}

export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

### Interfaces vs. Type Aliases

- Usar `interface` para shapes de objetos que puedan extenderse o implementarse
- Usar `type` para unions, intersections, tuples, mapped types y utility types
- Preferir uniones de string literals por sobre `enum` salvo que un `enum` sea necesario por interoperabilidad

```typescript
interface User {
  id: string
  email: string
}

type UserRole = 'admin' | 'member'
type UserWithRole = User & {
  role: UserRole
}
```

### Evitar `any`

- Evitar `any` en código de aplicación
- Usar `unknown` para input externo o no confiable, y después narrowearlo de forma segura
- Usar generics cuando el type de un valor depende de quien llama

```typescript
// INCORRECTO: any elimina la seguridad de types
function getErrorMessage(error: any) {
  return error.message
}

// CORRECTO: unknown fuerza un narrowing seguro
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
```

### Props de React

- Definir las props de componentes con un `interface` o `type` con nombre
- Tipar los callback props explícitamente
- No usar `React.FC` salvo que haya una razón específica para hacerlo

```typescript
interface User {
  id: string
  email: string
}

interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

### Archivos JavaScript

- En archivos `.js` y `.jsx`, usar JSDoc cuando los types mejoren la claridad y una migración a TypeScript no sea práctica
- Mantener el JSDoc alineado con el comportamiento en runtime

```javascript
/**
 * @param {{ firstName: string, lastName: string }} user
 * @returns {string}
 */
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}
```

## Inmutabilidad

Usar el spread operator para updates inmutables:

```typescript
interface User {
  id: string
  name: string
}

// INCORRECTO: Mutación
function updateUser(user: User, name: string): User {
  user.name = name // ¡MUTACIÓN!
  return user
}

// CORRECTO: Inmutabilidad
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  }
}
```

## Manejo de errores

Usar async/await con try-catch y narrowear errores `unknown` de forma segura:

```typescript
interface User {
  id: string
  email: string
}

declare function riskyOperation(userId: string): Promise<User>

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}

const logger = {
  error: (message: string, error: unknown) => {
    // Reemplazar con tu logger de producción (por ejemplo, pino o winston).
  }
}

async function loadUser(userId: string): Promise<User> {
  try {
    const result = await riskyOperation(userId)
    return result
  } catch (error: unknown) {
    logger.error('Operation failed', error)
    throw new Error(getErrorMessage(error))
  }
}
```

## Validación de inputs

Usar Zod para validación basada en esquemas e inferir types desde el esquema:

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

type UserInput = z.infer<typeof userSchema>

const validated: UserInput = userSchema.parse(input)
```

## Console.log

- Sin statements `console.log` en código de producción
- Usar librerías de logging apropiadas en su lugar
- Ver hooks para detección automática
