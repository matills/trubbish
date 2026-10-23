# Requerimientos de testing

## Cobertura mínima de tests: 80%

Tipos de test (TODOS requeridos):
1. **Unit Tests** - Funciones, utilidades y componentes individuales
2. **Integration Tests** - Endpoints de API, operaciones de base de datos
3. **E2E Tests** - Flujos de usuario críticos (framework elegido según el lenguaje)

## Test-Driven Development

Flujo OBLIGATORIO:
1. Escribir el test primero (RED)
2. Correr el test - debe FALLAR
3. Escribir la implementación mínima (GREEN)
4. Correr el test - debe PASAR
5. Refactorizar (IMPROVE)
6. Verificar cobertura (80%+)

## Troubleshooting de tests que fallan

1. Usar el agente **tdd-guide**
2. Verificar el aislamiento de los tests
3. Verificar que los mocks sean correctos
4. Corregir la implementación, no los tests (salvo que los tests estén mal)

## Soporte de agentes

- **tdd-guide** - Usar PROACTIVAMENTE para features nuevas, fuerza escribir-tests-primero

## Estructura de test (patrón AAA)

Preferir la estructura Arrange-Act-Assert:

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### Naming de tests

Usar nombres descriptivos que expliquen el comportamiento bajo test:

```typescript
test('returns empty array when no markets match query', () => {})
test('throws error when API key is missing', () => {})
test('falls back to substring search when Redis is unavailable', () => {})
```
