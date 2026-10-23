---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.
origin: ECC
---

# Flujo de Test-Driven Development

Este skill asegura que todo el desarrollo de código siga principios TDD con cobertura de tests exhaustiva.

## Cuándo activarlo

- Al escribir features o funcionalidad nueva
- Al corregir bugs o issues
- Al refactorizar código existente
- Al agregar endpoints de API
- Al crear componentes nuevos

## Principios core

### 1. Tests ANTES del código
SIEMPRE escribir los tests primero, después implementar el código para que los tests pasen.

### 2. Requerimientos de cobertura
- Mínimo 80% de cobertura (unit + integration + E2E)
- Todos los edge cases cubiertos
- Escenarios de error testeados
- Condiciones límite verificadas

### 3. Tipos de test

#### Unit Tests
- Funciones y utilidades individuales
- Lógica de componentes
- Funciones puras
- Helpers y utilidades

#### Integration Tests
- Endpoints de API
- Operaciones de base de datos
- Interacciones entre servicios
- Llamadas a APIs externas

#### E2E Tests (Playwright)
- Flujos de usuario críticos
- Workflows completos
- Automatización de browser
- Interacciones de UI

### 4. Checkpoints de Git
- Si el repositorio está bajo Git, crear un commit de checkpoint después de cada etapa de TDD
- No squashear ni reescribir estos commits de checkpoint hasta que el flujo esté completo
- El mensaje de cada commit de checkpoint debe describir la etapa y la evidencia exacta capturada
- Contar solo los commits creados en la branch activa actual para la tarea actual
- No tratar commits de otras branches, trabajo previo no relacionado, o historial de branches lejano como evidencia de checkpoint válida
- Antes de dar un checkpoint por satisfecho, verificar que el commit sea alcanzable desde el `HEAD` actual en la branch activa y pertenezca a la secuencia de la tarea actual
- El flujo compacto preferido es:
  - un commit por el test que falla agregado y RED validado
  - un commit por el fix mínimo aplicado y GREEN validado
  - un commit opcional por el refactor completo
- No hacen falta commits separados solo-de-evidencia si el commit del test corresponde claramente a RED y el commit del fix corresponde claramente a GREEN

## Pasos del flujo de TDD

### Paso 1: Escribir user journeys
```
Como [rol], quiero [acción], para [beneficio]

Ejemplo:
Como usuario, quiero buscar markets semánticamente,
para poder encontrar markets relevantes incluso sin keywords exactas.
```

### Paso 2: Generar casos de test
Para cada user journey, crear casos de test exhaustivos:

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Implementación del test
  })

  it('handles empty query gracefully', async () => {
    // Test del edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test del comportamiento de fallback
  })

  it('sorts results by similarity score', async () => {
    // Test de la lógica de ordenamiento
  })
})
```

### Paso 3: Correr los tests (deberían fallar)
```bash
npm test
# Los tests deberían fallar - todavía no implementamos nada
```

Este paso es obligatorio y es el gate RED para todos los cambios de producción.

Antes de modificar lógica de negocio u otro código de producción, tenés que verificar un estado RED válido vía uno de estos caminos:
- RED en runtime:
  - El target de test relevante compila exitosamente
  - El test nuevo o modificado realmente se ejecuta
  - El resultado es RED
- RED en compile-time:
  - El test nuevo instancia, referencia, o ejercita el path de código con el bug de nuevas formas
  - El fallo de compilación es en sí mismo la señal RED buscada
- En cualquiera de los dos casos, el fallo es causado por el bug de lógica de negocio buscado, comportamiento indefinido, o implementación faltante
- El fallo no está causado solo por errores de sintaxis no relacionados, setup de test roto, dependencias faltantes, o regresiones no relacionadas

Un test que solo se escribió pero no se compiló ni ejecutó no cuenta como RED.

No editar código de producción hasta que este estado RED esté confirmado.

Si el repositorio está bajo Git, crear un commit de checkpoint inmediatamente después de validar esta etapa.
Formato de mensaje de commit recomendado:
- `test: add reproducer for <feature or bug>`
- Este commit también puede servir como el checkpoint de validación RED si el reproducer se compiló y ejecutó y falló por la razón buscada
- Verificar que este commit de checkpoint esté en la branch activa actual antes de continuar

### Paso 4: Implementar el código
Escribir el código mínimo para que los tests pasen:

```typescript
// Implementación guiada por los tests
export async function searchMarkets(query: string) {
  // Implementación acá
}
```

Si el repositorio está bajo Git, stagear el fix mínimo ahora pero postergar el commit de checkpoint hasta que GREEN esté validado en el Paso 5.

### Paso 5: Correr los tests de nuevo
```bash
npm test
# Los tests ahora deberían pasar
```

Volver a correr el mismo target de test relevante después del fix y confirmar que el test que antes fallaba ahora está GREEN.

Solo después de un resultado GREEN válido podés avanzar a refactor.

Si el repositorio está bajo Git, crear un commit de checkpoint inmediatamente después de validar GREEN.
Formato de mensaje de commit recomendado:
- `fix: <feature or bug>`
- El commit del fix también puede servir como el checkpoint de validación GREEN si se volvió a correr el mismo target de test relevante y pasó
- Verificar que este commit de checkpoint esté en la branch activa actual antes de continuar

### Paso 6: Refactorizar
Mejorar la calidad del código manteniendo los tests en verde:
- Eliminar duplicación
- Mejorar naming
- Optimizar performance
- Mejorar la legibilidad

Si el repositorio está bajo Git, crear un commit de checkpoint inmediatamente después de que el refactor esté completo y los tests sigan en verde.
Formato de mensaje de commit recomendado:
- `refactor: clean up after <feature or bug> implementation`
- Verificar que este commit de checkpoint esté en la branch activa actual antes de considerar el ciclo de TDD completo

### Paso 7: Verificar cobertura
```bash
npm run test:coverage
# Verificar que se alcanzó 80%+ de cobertura
```

## Patrones de testing

### Patrón de Unit Test (Jest/Vitest)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Patrón de Integration Test de API
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    // Mockear la falla de base de datos
    const request = new NextRequest('http://localhost/api/markets')
    // Testear el manejo de errores
  })
})
```

### Patrón de E2E Test (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  // Navegar a la página de markets
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // Verificar que la página cargó
  await expect(page.locator('h1')).toContainText('Markets')

  // Buscar markets
  await page.fill('input[placeholder="Search markets"]', 'election')

  // Esperar el debounce y los resultados
  await page.waitForTimeout(600)

  // Verificar que se muestran los resultados de búsqueda
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // Verificar que los resultados contienen el término de búsqueda
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // Filtrar por status
  await page.click('button:has-text("Active")')

  // Verificar los resultados filtrados
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  // Login primero
  await page.goto('/creator-dashboard')

  // Llenar el form de creación de market
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // Enviar el form
  await page.click('button[type="submit"]')

  // Verificar el mensaje de éxito
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // Verificar el redirect a la página del market
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## Organización de archivos de test

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # Unit tests
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration tests
└── e2e/
    ├── markets.spec.ts               # E2E tests
    ├── trading.spec.ts
    └── auth.spec.ts
```

## Mockear servicios externos

### Mock de Supabase
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Mock de Redis
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### Mock de OpenAI
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // Embedding mock de 1536 dims
  ))
}))
```

## Verificación de cobertura de tests

### Correr el reporte de cobertura
```bash
npm run test:coverage
```

### Umbrales de cobertura
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Errores comunes de testing a evitar

### FAIL: INCORRECTO: testear detalles de implementación
```typescript
// No testear el estado interno
expect(component.state.count).toBe(5)
```

### PASS: CORRECTO: testear comportamiento visible para el usuario
```typescript
// Testear lo que ven los usuarios
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### FAIL: INCORRECTO: selectores frágiles
```typescript
// Se rompe fácilmente
await page.click('.css-class-xyz')
```

### PASS: CORRECTO: selectores semánticos
```typescript
// Resiliente a cambios
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### FAIL: INCORRECTO: sin aislamiento de tests
```typescript
// Los tests dependen entre sí
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* depende del test anterior */ })
```

### PASS: CORRECTO: tests independientes
```typescript
// Cada test arma sus propios datos
test('creates user', () => {
  const user = createTestUser()
  // Lógica del test
})

test('updates user', () => {
  const user = createTestUser()
  // Lógica de update
})
```

## Testing continuo

### Modo watch durante el desarrollo
```bash
npm test -- --watch
# Los tests corren automáticamente al cambiar archivos
```

### Pre-Commit Hook
```bash
# Corre antes de cada commit
npm test && npm run lint
```

### Integración CI/CD
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Buenas prácticas

1. **Escribir los tests primero** - Siempre TDD
2. **Un assert por test** - Enfocarse en un solo comportamiento
3. **Nombres de test descriptivos** - Explicar qué se está testeando
4. **Arrange-Act-Assert** - Estructura de test clara
5. **Mockear dependencias externas** - Aislar los unit tests
6. **Testear edge cases** - Null, undefined, vacío, grande
7. **Testear los paths de error** - No solo el happy path
8. **Mantener los tests rápidos** - Unit tests < 50ms cada uno
9. **Limpiar después de los tests** - Sin side effects
10. **Revisar los reportes de cobertura** - Identificar gaps

## Métricas de éxito

- 80%+ de cobertura de código alcanzada
- Todos los tests pasando (verde)
- Sin tests salteados o deshabilitados
- Ejecución de tests rápida (< 30s para unit tests)
- Los tests E2E cubren los flujos de usuario críticos
- Los tests detectan bugs antes de producción

---

**Recordá**: los tests no son opcionales. Son la red de seguridad que habilita refactors con confianza, desarrollo rápido, y confiabilidad en producción.
