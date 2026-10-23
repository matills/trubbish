---
name: nestjs-patterns
description: NestJS architecture patterns for modules, controllers, providers, DTO validation, guards, interceptors, config, and production-grade TypeScript backends.
origin: ECC
---

# Patrones de desarrollo NestJS

Patrones de producción para backends TypeScript modulares con NestJS.

## Cuándo activarlo

- Al construir APIs o servicios NestJS
- Al estructurar módulos, controllers y providers
- Al agregar validación de DTO, guards, interceptors, o exception filters
- Al configurar settings sensibles al entorno e integraciones de base de datos
- Al testear unidades de NestJS o endpoints HTTP

## Estructura del proyecto

```text
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   ├── configuration.ts
│   └── validation.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   └── users/
│       ├── dto/
│       ├── entities/
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
└── prisma/ o database/
```

- Mantener el código de dominio dentro de los módulos de feature.
- Poner filters, decorators, guards e interceptors transversales en `common/`.
- Mantener los DTOs cerca del módulo que los posee.

## Bootstrap y validación global

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- Siempre habilitar `whitelist` y `forbidNonWhitelisted` en APIs públicas.
- Preferir un solo validation pipe global en vez de repetir la config de validación por ruta.

## Módulos, controllers y providers

```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto) {
    return this.usersRepo.create(dto);
  }
}
```

- Los controllers deben mantenerse finos: parsear el input HTTP, llamar a un provider, devolver DTOs de respuesta.
- Poner la lógica de negocio en servicios inyectables, no en controllers.
- Exportar solo los providers que otros módulos realmente necesitan.

## DTOs y validación

```ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

- Validar todo DTO de request con `class-validator`.
- Usar DTOs o serializers de respuesta dedicados en vez de devolver entidades del ORM directamente.
- Evitar filtrar campos internos como password hashes, tokens, o columnas de audit.

## Auth, guards y contexto de request

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/report')
getAdminReport(@Req() req: AuthenticatedRequest) {
  return this.reportService.getForUser(req.user.id);
}
```

- Mantener las estrategias de auth y los guards locales al módulo salvo que sean realmente compartidos.
- Codificar reglas de acceso gruesas en guards, y hacer la autorización específica de recurso en los servicios.
- Preferir tipos de request explícitos para los objetos de request autenticados.

## Exception filters y forma del error

```ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        path: request.url,
        error: exception.getResponse(),
      });
    }

    return response.status(500).json({
      path: request.url,
      error: 'Internal server error',
    });
  }
}
```

- Mantener un envelope de error consistente en toda la API.
- Lanzar excepciones del framework para errores de cliente esperados; loguear y envolver las fallas inesperadas centralizadamente.

## Config y validación de entorno

```ts
ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
  validate: validateEnv,
});
```

- Validar el entorno al arrancar, no de forma lazy en el primer request.
- Mantener el acceso a la config detrás de helpers tipados o config services.
- Separar las diferencias dev/staging/prod en config factories en vez de ramificar por toda la feature.

## Persistencia y transacciones

- Mantener el código de repository/ORM detrás de providers que hablen el lenguaje del dominio.
- Para Prisma o TypeORM, aislar los flujos transaccionales en servicios que sean dueños de la unit of work.
- No dejar que los controllers coordinen escrituras multi-paso directamente.

## Testing

```ts
describe('UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
});
```

- Testear los providers de forma aislada con dependencias mockeadas en unit tests.
- Agregar tests a nivel de request para guards, validation pipes, y exception filters.
- Reusar en los tests los mismos pipes/filters globales que usás en producción.

## Defaults de producción

- Habilitar logging estructurado e IDs de correlación de request.
- Terminar ante env/config inválido en vez de arrancar parcialmente.
- Preferir inicialización async de providers para clientes de DB/cache con health checks explícitos.
- Mantener background jobs y event consumers en sus propios módulos, no dentro de los controllers HTTP.
- Hacer explícitos el rate limiting, auth, y audit logging para endpoints públicos.
