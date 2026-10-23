# Borrar mi vida digital

Encontrá las cuentas creadas con tu correo y borralas una por una. Sin contraseñas, nunca.

- **Producto:** [docs/PRODUCT.md](docs/PRODUCT.md) · **Diseño:** [docs/DESIGN.md](docs/DESIGN.md)
- **Stack:** NestJS + Drizzle + PostgreSQL + Redis/BullMQ (`apps/api`) · Vue 3 + Pinia + GSAP (`apps/web`) · contrato compartido en `packages/shared`

## Puesta en marcha

```bash
pnpm install
pnpm docker:up                          # Postgres :5434 y Redis :6381
cp apps/api/.env.example apps/api/.env  # completar ENCRYPTION_KEY y JWT_SECRET
pnpm db:migrate
pnpm db:seed                            # catálogo de servicios
pnpm dev                                # API :3010 (docs en /api/docs) + web :5174
```

Sin `SMTP_URL`, en desarrollo el código de verificación se muestra en pantalla y en la consola de la API.
Sin `HIBP_API_KEY`, la consulta de filtraciones corre en **modo demo** (brechas reales de ejemplo, marcado en la UI). En producción las dos son obligatorias para esas funciones.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | API y web en modo watch |
| `pnpm build` | Build de shared, API y web |
| `pnpm test` | Tests (Jest en la API, Vitest en la web) |
| `pnpm typecheck` | Tipos de todo el monorepo |
| `pnpm db:generate` | Genera una migración a partir de `schema.ts` |

## Cómo protege los datos

- **Login = verificación de titularidad:** código de 6 dígitos por correo (hash en Redis, 10 min, 5 intentos, 5 pedidos por hora).
- **Cero credenciales:** el CSV del navegador se lee en el cliente; solo viajan dominios.
- **Cifrado en reposo:** nombre, dominio, notas, brechas y cartas legales van con AES-256-GCM; la deduplicación usa HMAC por usuario.
- **Borrado total:** `DELETE /api/me` borra todo en cascada.

## Pendiente

- Verificar a mano los enlaces del catálogo (`apps/api/src/database/catalog-data.ts`): los sitios los cambian seguido.
- Fase 2 (comprobación automática en lote, teléfono, recordatorios) y Fase 3 (monitoreo).
