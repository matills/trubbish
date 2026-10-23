# Lineamientos de seguridad

## Checks de seguridad obligatorios

Antes de CUALQUIER commit:
- [ ] Sin secrets hardcodeados (API keys, contraseñas, tokens)
- [ ] Todos los inputs de usuario validados
- [ ] Prevención de SQL injection (queries parametrizadas)
- [ ] Prevención de XSS (HTML sanitizado)
- [ ] Protección CSRF habilitada
- [ ] Autenticación/autorización verificada
- [ ] Rate limiting en todos los endpoints
- [ ] Los mensajes de error no filtran datos sensibles

## Manejo de secrets

- NUNCA hardcodear secrets en el código fuente
- SIEMPRE usar variables de entorno o un secret manager
- Validar que los secrets requeridos estén presentes al arrancar
- Rotar cualquier secret que pueda haberse expuesto

## Protocolo de respuesta ante un problema de seguridad

Si se encuentra un problema de seguridad:
1. PARAR inmediatamente
2. Usar el agente **security-reviewer**
3. Corregir los issues CRITICAL antes de continuar
4. Rotar cualquier secret expuesto
5. Revisar todo el codebase por issues similares
