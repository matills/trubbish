# AGENT.md — Borrar mi vida digital Backend (NestJS)

Lineamientos de comportamiento para desarrollo asistido por IA en este proyecto.
**Tradeoff:** Estos lineamientos priorizan la cautela por sobre la velocidad. Para tareas triviales, usar criterio.

---

## 1. Pensar antes de codear

No asumas. No ocultes la confusión. Hacé explícitos los tradeoffs.

Antes de implementar:

- Enunciá tus supuestos explícitamente. Si hay incertidumbre, preguntá.
- Si existen múltiples interpretaciones, presentalas — no elijas en silencio.
- Si existe un approach más simple, decilo. Cuestioná cuando corresponda.
- Si algo no está claro, parate. Nombrá qué es confuso. Preguntá.

---

## 2. Simplicidad primero

El código mínimo que resuelve el problema. Nada especulativo.

- Sin features más allá de lo pedido.
- Sin abstracciones para código de un solo uso.
- Sin "flexibilidad" o "configurabilidad" que no se pidió.
- Sin manejo de errores para escenarios imposibles.
- Si escribís 200 líneas y podrían ser 50, reescribilo.

Preguntate: *"¿Un ingeniero senior diría que esto está sobrecomplicado?"* Si la respuesta es sí, simplificá.

---

## 3. Cambios quirúrgicos

Tocá solo lo que sea necesario. Limpiá solo tu propio desorden.

Al editar código existente:

- No "mejores" código, comentarios o formato adyacente.
- No refactorices cosas que no están rotas.
- Igualá el estilo existente, aunque lo harías distinto.
- Si notás dead code no relacionado, mencionalo — no lo borres.

Cuando tus cambios generan huérfanos:

- Eliminá imports/variables/funciones que **tus** cambios dejaron sin uso.
- No elimines dead code preexistente salvo que se pida.

**El test:** cada línea cambiada debe poder trazarse directo al pedido del usuario.

---

## 4. Ejecución orientada a objetivos

Definí criterios de éxito. Iterá hasta verificar.

Transformá tareas en objetivos verificables:

- `"Agregar validación"` → `"Escribir tests para inputs inválidos, después hacer que pasen"`
- `"Arreglar el bug"` → `"Escribir un test que lo reproduzca, después hacer que pase"`
- `"Refactorizar X"` → `"Asegurar que los tests pasen antes y después"`

Para tareas de múltiples pasos, enunciá un plan breve:

```
1. [Paso] → verificar: [check]
2. [Paso] → verificar: [check]
3. [Paso] → verificar: [check]
```

---

## 5. Estructura de módulos NestJS

Cada feature vive en su propio módulo. Sin imports directos de servicios entre módulos — usar los exports del módulo.

### Estructura de carpetas por módulo

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── auth.service.spec.ts
│   ├── users/
│   ├── verification/   # código de titularidad del correo
│   ├── catalog/        # servicios: enlace de recuperación, de borrado, dificultad
│   ├── accounts/       # cuentas del usuario y su estado
│   ├── imports/        # CSV de contraseñas del navegador y apps conectadas
│   ├── breaches/       # Have I Been Pwned
│   └── requests/       # pedidos de supresión (Ley 25.326 / RGPD)
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
├── database/
│   ├── database.module.ts   # provee el injection token DRIZZLE
│   └── schema.ts
└── main.ts
```

### Reglas

- Un controller por módulo. Los controllers solo manejan HTTP — sin lógica de negocio.
- Toda la lógica de negocio vive en los servicios.
- Los servicios nunca importan servicios de otro módulo directamente — usar el servicio exportado del módulo vía `imports: [OtherModule]`.
- `common/` es para utilidades verdaderamente compartidas y stateless (guards, decorators, pipes). No para lógica de negocio.

---

## 6. DTO y Validación

- Todo request body entrante debe tener un DTO.
- Los DTOs usan decorators de `class-validator` — nunca validar manualmente dentro de un servicio.
- Los DTOs deben estar tipados — nada de `any`.
- Usar `@ApiProperty()` de `@nestjs/swagger` en cada campo del DTO.

```ts
// ✅ Correcto
export class CreateReviewDto {
  @ApiProperty({ example: 'Great movie!' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  body: string

  @ApiProperty({ example: 8, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number
}

// ❌ Incorrecto — validando dentro del servicio
async createReview(dto: any) {
  if (!dto.body || dto.body.length < 10) throw new Error('...')
}
```

- El `ValidationPipe` global está configurado en `main.ts` con `whitelist: true` y `forbidNonWhitelisted: true`. No deshabilitar esto.

---

## 7. Manejo de errores

- Lanzar las excepciones HTTP built-in de NestJS — nunca un `Error` genérico.
- Los servicios lanzan excepciones; los controllers no las atrapan (dejar que el filtro global se encargue).
- No agregar try/catch salvo que se haga algo significativo con el error.

```ts
// ✅ Correcto
throw new NotFoundException(`Content with id ${id} not found`)
throw new ForbiddenException('You do not have permission to edit this list')
throw new ConflictException('Email already registered')

// ❌ Incorrecto
throw new Error('not found')
throw new HttpException('Something went wrong', 500) // demasiado vago
```

---

## 8. Base de datos (Drizzle)

- Todo acceso a la DB pasa por `DrizzleService`. Nunca instanciar el cliente de Drizzle directamente fuera del servicio.
- Mantener las queries en la capa de servicio — nunca en los controllers.
- Siempre seleccionar solo las columnas necesarias. Nunca devolver entidades completas con campos sensibles (ej: `passwordHash`).
- Usar `db.transaction()` cuando múltiples escrituras deban ser atómicas.

```ts
// ✅ Correcto — selección explícita de columnas
const user = await this.db.query.users.findFirst({
  where: eq(users.id, id),
  columns: { id: true, username: true, avatarUrl: true },
})

// ❌ Incorrecto — devuelve passwordHash y otros campos sensibles
const user = await this.db.query.users.findFirst({
  where: eq(users.id, id),
})

// ✅ Correcto — transacción
await this.db.transaction(async (tx) => {
  await tx.insert(schema.lists).values(listData)
  await tx.insert(schema.listCollaborators).values(collaboratorData)
})
```

---

## 9. Autenticación y Autorización

- Usar `@UseGuards(JwtAuthGuard)` en rutas protegidas — nunca chequear `req.user` manualmente.
- Usar el decorator custom `@CurrentUser()` para extraer el usuario del request. Nunca acceder a `req.user` directamente en un controller.
- Los checks de rol/permiso que involucran queries a la DB van en el **servicio**, no en el guard.

```ts
// ✅ Correcto
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: JwtPayload) {
  return this.usersService.findById(user.sub)
}

// ❌ Incorrecto
@Get('me')
getMe(@Req() req: Request) {
  return this.usersService.findById((req as any).user.id)
}
```

---

## 10. Forma de la respuesta

- Todas las respuestas siguen una forma consistente vía un response interceptor. No envolver manualmente en los controllers.
- Los controllers devuelven datos planos — el interceptor maneja el envelope.
- Las respuestas paginadas deben incluir: `data`, `total`, `page`, `limit`.

```ts
// ✅ El controller devuelve datos planos
async findAll(): Promise<Review[]> {
  return this.reviewsService.findAll()
}

// ❌ No envolver manualmente
return { success: true, data: reviews } // el interceptor se encarga de esto
```

---

## 11. Reglas de async

- Siempre `await` las promises — nunca fire-and-forget salvo que se use explícitamente una queue.
- Si una tarea es fire-and-forget por diseño (ej: enviar una notificación después de una acción), despacharla a una **queue de BullMQ**, no usar `void somePromise()`.

```ts
// ✅ Correcto — el side effect va a una queue
await this.breachesQueue.add('lookup', { userId, scanId: scan.id })

// ❌ Incorrecto — el fire-and-forget oculta errores
void this.breachesService.lookup(userId, scan.id)
```

---

## 12. Testing

- Testear los servicios en unit tests, no los controllers.
- Mockear el cliente de Drizzle (el provider `DRIZZLE`) en unit tests — nunca golpear una DB real en unit tests.
- Los integration tests (e2e) pueden usar una DB de test.
- Naming de archivos de test: `*.service.spec.ts` para unit, `*.e2e-spec.ts` para integration.
- Apuntar a testear comportamiento, no implementación. Testear qué devuelve una función, no cómo lo hace internamente.

---

## 13. Checklist antes de entregar una feature

- [ ] DTO creado con decorators de `class-validator` y `@ApiProperty()`
- [ ] Lógica de negocio en el servicio, no en el controller
- [ ] Solo se lanzan excepciones HTTP de NestJS
- [ ] Las queries de Drizzle seleccionan solo las columnas necesarias — nunca devuelven filas completas con campos sensibles
- [ ] Las rutas protegidas usan `@UseGuards(JwtAuthGuard)` y `@CurrentUser()`
- [ ] Los side effects se despachan a una queue de BullMQ, no fire-and-forget
- [ ] Se escribieron unit tests para el servicio
- [ ] Los docs de Swagger son visibles en `/api` después de los cambios
