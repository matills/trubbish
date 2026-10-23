# Estándares de code review

## Propósito

El code review asegura calidad, seguridad y mantenibilidad antes de mergear código. Esta regla define cuándo y cómo hacer code reviews.

## Cuándo revisar

**Triggers de review OBLIGATORIOS:**

- Después de escribir o modificar código
- Antes de cualquier commit a branches compartidas
- Cuando se cambia código sensible en seguridad (auth, pagos, datos de usuario)
- Cuando se hacen cambios arquitectónicos
- Antes de mergear pull requests

**Requerimientos previos a la review:**

Antes de pedir review, asegurarse de que:

- Todos los checks automatizados (CI/CD) estén pasando
- Los conflictos de merge estén resueltos
- La branch esté actualizada respecto a la branch destino

## Checklist de review

Antes de marcar el código como completo:

- [ ] El código es legible y está bien nombrado
- [ ] Las funciones están enfocadas (<50 líneas)
- [ ] Los archivos son cohesivos (<800 líneas)
- [ ] No hay anidamiento profundo (>4 niveles)
- [ ] Los errores se manejan explícitamente
- [ ] Sin secrets ni credenciales hardcodeadas
- [ ] Sin console.log ni statements de debug
- [ ] Existen tests para la funcionalidad nueva
- [ ] La cobertura de tests cumple el mínimo de 80%

## Triggers de security review

**PARAR y usar el agente security-reviewer cuando:**

- Código de autenticación o autorización
- Manejo de input de usuario
- Queries de base de datos
- Operaciones de sistema de archivos
- Llamadas a APIs externas
- Operaciones criptográficas
- Código de pagos o financiero

## Niveles de severidad en review

| Nivel | Significado | Acción |
|-------|---------|--------|
| CRITICAL | Vulnerabilidad de seguridad o riesgo de pérdida de datos | **BLOQUEA** - Debe corregirse antes de mergear |
| HIGH | Bug o problema de calidad significativo | **ADVERTENCIA** - Debería corregirse antes de mergear |
| MEDIUM | Preocupación de mantenibilidad | **INFO** - Considerar corregir |
| LOW | Estilo o sugerencia menor | **NOTA** - Opcional |

## Uso de agentes

Usar estos agentes para code review:

| Agente | Propósito |
|-------|---------|
| **code-reviewer** | Calidad de código general, patrones, best practices |
| **security-reviewer** | Vulnerabilidades de seguridad, OWASP Top 10 |
| **typescript-reviewer** | Issues específicos de TypeScript/JavaScript |
| **python-reviewer** | Issues específicos de Python |
| **go-reviewer** | Issues específicos de Go |
| **rust-reviewer** | Issues específicos de Rust |

## Flujo de review

```
1. Correr git diff para entender los cambios
2. Chequear primero el checklist de seguridad
3. Revisar el checklist de calidad de código
4. Correr los tests relevantes
5. Verificar cobertura >= 80%
6. Usar el agente apropiado para una revisión detallada
```

## Issues comunes a detectar

### Seguridad

- Credenciales hardcodeadas (API keys, contraseñas, tokens)
- SQL injection (concatenación de strings en queries)
- Vulnerabilidades XSS (input de usuario sin escapar)
- Path traversal (paths de archivo sin sanitizar)
- Falta protección CSRF
- Bypasses de autenticación

### Calidad de código

- Funciones grandes (>50 líneas) - dividir en más chicas
- Archivos grandes (>800 líneas) - extraer módulos
- Anidamiento profundo (>4 niveles) - usar early returns
- Falta manejo de errores - manejar explícitamente
- Patrones de mutación - preferir operaciones inmutables
- Faltan tests - agregar cobertura de tests

### Performance

- Queries N+1 - usar JOINs o batching
- Falta paginación - agregar LIMIT a las queries
- Queries sin límites - agregar constraints
- Falta caching - cachear operaciones costosas

## Criterios de aprobación

- **Approve**: Sin issues CRITICAL ni HIGH
- **Warning**: Solo issues HIGH (mergear con cautela)
- **Block**: Se encontraron issues CRITICAL

## Integración con otras reglas

Esta regla trabaja junto con:

- [testing.md](testing.md) - Requerimientos de cobertura de tests
- [security.md](security.md) - Checklist de seguridad
- [git-workflow.md](git-workflow.md) - Estándares de commit
- [agents.md](agents.md) - Delegación a agentes
