# Flujo de desarrollo

> Este archivo extiende [common/git-workflow.md](./git-workflow.md) con el proceso completo de desarrollo de features que ocurre antes de las operaciones de git.

El Flujo de Implementación de Features describe el pipeline de desarrollo: research, planning, TDD, code review, y dejar el trabajo listo para que el usuario lo commitee.

## Flujo de implementación de features

0. **Research & Reuse** _(obligatorio antes de cualquier implementación nueva)_

   **Paso 0a — Buscar primero en el codebase local (SIEMPRE):**
   - Antes de crear cualquier type, constante, helper, utilidad o componente, **buscar en el proyecto** para confirmar que no exista ya.
   - Usar `grep` o la tool Grep en `src/types/`, `src/utils/`, `src/constants/`, `src/composables/`, `src/components/` antes de declarar algo como nuevo.
   - ¿Lo encontraste en otro lado del codebase? → **importalo**. Nunca lo copies y pegues.
   - ¿Casi encaja? → **extendelo**. Nunca lo bifurques en una copia privada.
   - ¿Realmente no existe? → creá en la **ubicación compartida canónica**, nunca inline en un solo archivo salvo que sea genuinamente privado a ese archivo únicamente.
   - Ver [coding-style.md](./coding-style.md#buscar-antes-de-crear-crítico) para la tabla completa de búsqueda por tipo de artefacto.

   **Paso 0b — Después buscar externamente:**
   - **Búsqueda de código en GitHub:** correr `gh search repos` y `gh search code` para encontrar implementaciones existentes antes de escribir algo nuevo.
   - **Docs de librerías:** usar Context7 o la documentación oficial del vendor para confirmar el comportamiento de la API antes de implementar.
   - **Registries de paquetes:** buscar en npm, PyPI, crates.io, etc. antes de escribir código utilitario. Preferir librerías battle-tested.
   - Preferir adoptar o portar un approach probado en vez de escribir código net-new cuando cumple el requerimiento.

1. **Planificar primero**
   - Usar el agente **planner** para crear el plan de implementación
   - Generar docs de planning antes de codear: PRD, arquitectura, system_design, tech_doc, task_list
   - Identificar dependencias y riesgos
   - Dividir en fases

2. **Approach TDD**
   - Usar el agente **tdd-guide**
   - Escribir tests primero (RED)
   - Implementar hasta pasar los tests (GREEN)
   - Refactorizar (IMPROVE)
   - Verificar cobertura 80%+

3. **Code Review**
   - Usar el agente **code-reviewer** inmediatamente después de escribir código
   - Resolver issues CRITICAL y HIGH
   - Corregir issues MEDIUM cuando sea posible

4. **Listo para commit (el agente no commitea ni pushea)**
   - El agente nunca corre `git commit`/`git push` — ver [git-workflow.md](./git-workflow.md#nunca-commitear-ni-pushear-crítico)
   - Dejar el working tree tal cual; si se pide, redactar un mensaje de commit siguiendo el formato conventional commits de [git-workflow.md](./git-workflow.md)
   - El usuario revisa, commitea y pushea por su cuenta

5. **Checks previos a la review**
   - Verificar que todos los checks automatizados (CI/CD) estén pasando
   - Resolver cualquier conflicto de merge
   - Asegurarse de que la branch esté actualizada respecto a la branch destino
   - Solo pedir review después de que estos checks pasen
