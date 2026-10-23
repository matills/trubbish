# Flujo de git

## Nunca commitear ni pushear (CRÍTICO)

El agente **nunca** debe correr `git commit` ni `git push` en este proyecto, aunque parezca el siguiente paso natural después de terminar una tarea. Dejar el working tree staged/unstaged tal cual y que el usuario revise, commitee y pushee por su cuenta. Crear branches, correr `git diff`/`git status`/`git log`, y hacer stash están permitidos — solo la acción de commit/push en sí está prohibida.

Consecuencia práctica: tampoco correr `gh pr create`, ya que necesita una branch pusheada. Si se pide abrir un PR, redactar el resumen (ver abajo) y esperar a que el usuario pushee, o pedirle que lo haga.

## Formato de mensaje de commit

Formato de referencia para cuando el usuario pide que se redacte un mensaje de commit (ellos corren el `git commit` real):
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Nota: la atribución está deshabilitada globalmente vía ~/.claude/settings.json.

## Flujo de Pull Request

Una vez que el usuario pusheó la branch y pide un PR:
1. Analizar el historial completo de commits (no solo el último commit)
2. Usar `git diff [base-branch]...HEAD` para ver todos los cambios
3. Redactar un resumen de PR completo
4. Incluir un plan de testing con TODOs

> Para el proceso de desarrollo completo (planning, TDD, code review) antes de las operaciones de git,
> ver [development-workflow.md](./development-workflow.md).
