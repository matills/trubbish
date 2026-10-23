# PRODUCT.md — Borrar mi vida digital

> Referencia de producto activa. Fuente original: el documento de producto en Claude Docs
> (https://claude.ai/artifact/Tm3euXvrCRqjcLyp1DAna8). Si este archivo y el doc discrepan, se corrige este archivo.

## Qué es

Una herramienta que, a partir de un correo, encuentra las cuentas creadas con él y guía al usuario hasta borrarlas una por una.

**Problema:** nadie recuerda todos los servicios donde se registró. No hay registro central de cuentas por correo, y revisar la bandeja o un gestor de contraseñas falla para quien limpia su correo seguido o no usa gestor. Resultado: cuentas olvidadas con datos personales expuestos a filtraciones.

**Éxito = cuentas cerradas**, no cuentas encontradas.

## Usuario

Persona que quiere reducir su huella digital y no tiene registro de dónde se anotó. Casos de uso: limpieza total, después de una filtración, cambio o abandono de correo, mantenimiento periódico.

## No-objetivos

- Borrar cuentas automáticamente iniciando sesión por el usuario (exige manejar contraseñas).
- Buscar cuentas de correos ajenos.
- Prometer cobertura total — el producto lo dice con claridad.

## Flujo

1. El usuario verifica su correo con un código.
2. El producto arma la lista de cuentas (catálogo + importaciones + filtraciones + memoria guiada).
3. El usuario marca qué cuentas conserva; esas salen de la lista.
4. Por cada cuenta restante: **borrado directo** (enlace + pasos + dificultad) o **pedido legal** (Ley 25.326 / RGPD) si el servicio no tiene botón de borrar.
5. Seguimiento del estado hasta el cierre.

## Entidades (borrador)

| Entidad | Qué guarda |
|---|---|
| `User` | Usuario de la app |
| `VerifiedEmail` | Correo, código (hash), expiración, verificado en |
| `CatalogService` | Nombre, dominio, categoría, enlace de recuperación, enlace de borrado, dificultad (fácil/media/difícil/imposible), contacto de privacidad |
| `TrackedAccount` | Cuenta del usuario en un servicio: origen (catálogo, import navegador, apps conectadas, filtración, memoria guiada), estado, notas — **cifrada en reposo** |
| `Breach` | Brecha de HIBP asociada al correo |
| `DeletionRequest` | Pedido de supresión generado: ley aplicada, fecha de envío, fecha límite de respuesta, respuesta |

**Estados de `TrackedAccount`:** `TO_REVIEW` (por revisar) → `KEEP` (conservar) | `IN_PROGRESS` (en proceso) → `DELETED` (borrada).

## Reglas de negocio no negociables

1. **Titularidad primero.** Ningún método de descubrimiento corre sobre un correo sin verificación de titularidad vigente.
2. **Cero credenciales.** El producto nunca recibe, guarda ni loguea contraseñas. El CSV de contraseñas del navegador se parsea en el cliente y solo se suben los dominios.
3. **Datos mínimos y cifrados.** La lista de cuentas se guarda cifrada en reposo (o solo en el dispositivo) y el usuario puede borrar todo en cualquier momento.
4. **APIs externas solo desde el backend**, vía cola BullMQ y con rate limit (HIBP, envío de correo).
5. **Nunca retornar entidades completas.** Seleccionar columnas explícitas; `passwordHash`, códigos y tokens jamás llegan a una respuesta.
6. **Confirmación explícita antes de marcar como borrada** una cuenta de categoría sensible (banco, trabajo, gobierno, salud).

## Roadmap

| Fase | Alcance |
|---|---|
| **0 — Prueba personal** | Tracker con ~100 servicios comunes, enlaces de recuperación y borrado. Probar con el correo propio. |
| **1 — MVP** | Verificación del correo, import de contraseñas del navegador y apps conectadas, consulta de filtraciones, tracker con estados, generador de pedidos legales. |
| **2 — Automatización** | Comprobación automática en lote (tipo holehe, con límites), búsqueda por teléfono, recordatorios. |
| **3 — Monitoreo** | Revisión periódica de cuentas nuevas y alertas ante filtraciones. |

## Métricas

Cuentas descubiertas por usuario · cuentas confirmadas como borradas · tasa de cierre (borradas / descubiertas) · tiempo hasta cerrar cada cuenta · pedidos legales respondidos.

## Preguntas abiertas

- ¿Proyecto personal o producto para otros usuarios?
- ¿Búsqueda por teléfono en el MVP?
- ¿Gratis, pago único o suscripción para el monitoreo?
