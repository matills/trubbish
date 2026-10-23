---
name: redis-patterns
description: Redis data structure patterns, caching strategies, distributed locks, rate limiting, pub/sub, and connection management for production applications.
origin: ECC
---

# Patrones de Redis

Referencia rápida de best practices de Redis para casos de uso de backend comunes.

## Cómo funciona

Redis es un data structure store in-memory que soporta strings, hashes, lists, sets, sorted sets, streams, y más. Los comandos individuales de Redis son atómicos en una sola instancia; los flujos de múltiples pasos requieren scripts Lua, transacciones MULTI/EXEC, o sincronización explícita para mantenerse atómicos. Los datos se persisten opcionalmente vía snapshots RDB o logs AOF. Los clientes se comunican sobre TCP usando el protocolo RESP; los connection pools son esenciales para evitar el overhead de handshake por request.

## Cuándo activarlo

- Al agregar caching a una aplicación
- Al implementar rate limiting o throttling
- Al construir locks distribuidos o coordinación
- Al configurar almacenamiento de sesión o tokens
- Al usar Pub/Sub o Redis Streams para mensajería
- Al configurar Redis en producción (pooling, eviction, clustering)

## Cheat Sheet de estructuras de datos

| Caso de uso | Estructura | Key de ejemplo |
|----------|-----------|-------------|
| Cache simple | String | `product:123` |
| Sesión de usuario | Hash | `session:abc` |
| Leaderboard | Sorted Set | `scores:weekly` |
| Visitantes únicos | Set | `visitors:2024-01-01` |
| Feed de actividad | List | `feed:user:456` |
| Stream de eventos | Stream | `events:orders` |
| Contadores / rate limits | String (INCR) | `ratelimit:user:123` |
| Bloom filter / HLL | HyperLogLog | `hll:pageviews` |

## Patrones core

### Cache-Aside (Lazy Loading)

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_product(product_id: int):
    cache_key = f"product:{product_id}"
    cached = r.get(cache_key)

    if cached:
        return json.loads(cached)

    product = db.query("SELECT * FROM products WHERE id = %s", product_id)
    r.setex(cache_key, 3600, json.dumps(product))  # TTL: 1 hora
    return product
```

### Write-Through Cache

```python
def update_product(product_id: int, data: dict):
    # Escribir a la DB primero
    db.execute("UPDATE products SET ... WHERE id = %s", product_id)

    # Actualizar el cache de inmediato
    cache_key = f"product:{product_id}"
    r.setex(cache_key, 3600, json.dumps(data))
```

### Invalidación de cache

```python
# Invalidación por tag — agrupar keys relacionadas bajo un set
def cache_product(product_id: int, category_id: int, data: dict):
    key = f"product:{product_id}"
    tag = f"tag:category:{category_id}"
    pipe = r.pipeline(transaction=True)
    pipe.setex(key, 3600, json.dumps(data))
    pipe.sadd(tag, key)
    pipe.expire(tag, 3600)
    pipe.execute()

def invalidate_category(category_id: int):
    tag = f"tag:category:{category_id}"
    keys = r.smembers(tag)
    if keys:
        r.delete(*keys)
    r.delete(tag)
```

### Almacenamiento de sesión

```python
import time
import uuid

def create_session(user_id: int, ttl: int = 86400) -> str:
    session_id = str(uuid.uuid4())
    key = f"session:{session_id}"
    pipe = r.pipeline(transaction=True)
    pipe.hset(key, mapping={
        "user_id": user_id,
        "created_at": int(time.time()),
    })
    pipe.expire(key, ttl)
    pipe.execute()
    return session_id

def get_session(session_id: str) -> dict | None:
    data = r.hgetall(f"session:{session_id}")
    return data if data else None

def delete_session(session_id: str):
    r.delete(f"session:{session_id}")
```

## Rate Limiting

### Fixed Window (Simple)

```python
def is_rate_limited(user_id: int, limit: int = 100, window: int = 60) -> bool:
    key = f"ratelimit:{user_id}:{int(time.time()) // window}"
    pipe = r.pipeline(transaction=True)
    pipe.incr(key)
    pipe.expire(key, window)
    count, _ = pipe.execute()
    return count > limit
```

### Sliding Window (Lua — Atómico)

```lua
-- sliding_window.lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
    -- Usar un member único (now + secuencia) para evitar colisiones dentro del mismo milisegundo
    local seq_key = key .. ':seq'
    local seq = redis.call('INCR', seq_key)
    redis.call('EXPIRE', seq_key, math.ceil(window / 1000))
    redis.call('ZADD', key, now, now .. '-' .. seq)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1
end
return 0
```

```python
sliding_window = r.register_script(open('sliding_window.lua').read())

def allow_request(user_id: int) -> bool:
    key = f"ratelimit:sliding:{user_id}"
    now = int(time.time() * 1000)
    return bool(sliding_window(keys=[key], args=[now, 60000, 100]))
```

## Locks distribuidos

### Lock distribuido (nodo único — SET NX PX)

```python
import uuid

def acquire_lock(resource: str, ttl_ms: int = 5000) -> str | None:
    lock_key = f"lock:{resource}"
    token = str(uuid.uuid4())
    acquired = r.set(lock_key, token, px=ttl_ms, nx=True)
    return token if acquired else None

def release_lock(resource: str, token: str) -> bool:
    release_script = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """
    result = r.eval(release_script, 1, f"lock:{resource}", token)
    return bool(result)

# Uso
token = acquire_lock("order:payment:123")
if token:
    try:
        process_payment()
    finally:
        release_lock("order:payment:123", token)
```

> Para setups multi-nodo usar la librería `redlock-py` que implementa el algoritmo Redlock completo.

## Pub/Sub y Streams

### Pub/Sub (Fire-and-Forget)

```python
# Publisher
def publish_event(channel: str, payload: dict):
    r.publish(channel, json.dumps(payload))

# Subscriber (bloqueante — correr en un thread/process separado)
def subscribe_events(channel: str):
    pubsub = r.pubsub()
    pubsub.subscribe(channel)
    for message in pubsub.listen():
        if message['type'] == 'message':
            handle(json.loads(message['data']))
```

### Redis Streams (Queue durable)

```python
# Producer
def emit(stream: str, event: dict):
    r.xadd(stream, event, maxlen=10000)  # Limitar el largo del stream

# Consumer group — garantiza delivery al menos una vez
try:
    r.xgroup_create('events:orders', 'processor', id='0', mkstream=True)
except Exception:
    pass  # El group ya existe

def consume(stream: str, group: str, consumer: str):
    while True:
        messages = r.xreadgroup(group, consumer, {stream: '>'}, count=10, block=2000)
        for _, entries in (messages or []):
            for msg_id, data in entries:
                process(data)
                r.xack(stream, group, msg_id)
```

> Preferir **Streams** por sobre Pub/Sub cuando necesitás garantías de delivery, consumer groups, o replay.

## Diseño de keys

### Convenciones de nombres

```
# Patrón: resource:id:field
user:123:profile
order:456:status
cache:product:789

# Patrón: namespace:resource:id
myapp:session:abc123
myapp:ratelimit:user:123

# Patrón: resource:date (keys acotadas en el tiempo)
stats:pageviews:2024-01-01
```

### Estrategia de TTL

| Tipo de dato | TTL sugerido |
|-----------|--------------|
| Sesión de usuario | 24h (`86400`) |
| Cache de respuesta de API | 5–15 min |
| Ventana de rate limit | Igualar el tamaño de la ventana |
| Tokens de corta duración | 5–10 min |
| Leaderboard | 1h–24h |
| Datos estáticos/de referencia | 1h–1 semana |

Siempre setear un TTL. Las keys sin TTL se acumulan indefinidamente y causan presión de memoria.

## Manejo de conexiones

### Connection Pooling

```python
from redis import ConnectionPool, Redis

pool = ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=20,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)

r = Redis(connection_pool=pool)
```

### Modo Cluster

```python
from redis.cluster import RedisCluster

r = RedisCluster(
    startup_nodes=[{"host": "redis-1", "port": 6379}],
    decode_responses=True,
    skip_full_coverage_check=True,
)
```

### Sentinel (alta disponibilidad)

```python
from redis.sentinel import Sentinel

sentinel = Sentinel(
    [('sentinel-1', 26379), ('sentinel-2', 26379)],
    socket_timeout=0.5,
)
master = sentinel.master_for('mymaster', decode_responses=True)
replica = sentinel.slave_for('mymaster', decode_responses=True)
```

## Políticas de eviction

| Política | Comportamiento | Mejor para |
|--------|----------|----------|
| `noeviction` | Error al escribir cuando está lleno | Queues / datos críticos |
| `allkeys-lru` | Evict del usado menos recientemente | Cache general |
| `volatile-lru` | LRU solo entre keys con TTL | Data store mixto |
| `allkeys-lfu` | Evict del usado con menos frecuencia | Patrones de acceso sesgados |
| `volatile-ttl` | Evict del que expira más pronto | Priorizar datos de larga vida |

Setear vía `redis.conf`: `maxmemory-policy allkeys-lru`

## Anti-patrones

| Anti-patrón | Problema | Corrección |
|---|---|---|
| Keys sin TTL | La memoria crece sin límite | Siempre setear TTL |
| `KEYS *` en producción | Bloquea el server (O(N)) | Usar el cursor `SCAN` |
| Guardar blobs grandes (>100KB) | Serialización lenta, presión de memoria | Guardar una referencia + traer del object store |
| Un solo Redis para todo | Sin aislamiento entre cache y queue | Usar DBs o instancias separadas |
| Ignorar los límites del connection pool | Agotamiento de conexiones bajo carga | Dimensionar el pool según la carga de trabajo |
| No manejar el cache miss stampede | Thundering herd en cold start | Usar locks o expiración temprana probabilística |
| `FLUSHALL` sin pensarlo | Borra la instancia entera | Acotar los deletes por patrón de key |

### Prevención de Cache Miss Stampede

```python
import threading

_locks: dict[str, threading.Lock] = {}
_locks_mutex = threading.Lock()

def get_with_lock(key: str, fetch_fn, ttl: int = 300):
    cached = r.get(key)
    if cached:
        return json.loads(cached)

    with _locks_mutex:
        if key not in _locks:
            _locks[key] = threading.Lock()
        lock = _locks[key]
    with lock:
        cached = r.get(key)  # Re-chequear después de adquirir el lock
        if cached:
            return json.loads(cached)
        value = fetch_fn()
        r.setex(key, ttl, json.dumps(value))
        return value
```

> Nota: para deployments multi-proceso, reemplazar el lock in-process por `acquire_lock`/`release_lock` de la sección de Locks Distribuidos de arriba.

## Ejemplos

**Agregar caching a un endpoint de API Django/Flask:**
Usar cache-aside con `setex` y un TTL de 5 minutos en la respuesta. Key en base a los parámetros del request.

**Rate-limitear una API por usuario:**
Usar fixed-window con `pipeline(transaction=True)` para endpoints de bajo tráfico; usar sliding-window con Lua para throttling preciso por usuario.

**Coordinar un background job entre workers:**
Usar `acquire_lock` con un TTL que exceda la duración esperada del job. Siempre liberar en un bloque `finally`.

**Fan-out de notificaciones a múltiples subscribers:**
Usar Pub/Sub para fire-and-forget. Cambiar a Streams si necesitás delivery garantizado o replay para consumers tardíos.

## Referencia rápida

| Patrón | Cuándo usarlo |
|---------|-------------|
| Cache-aside | Read-heavy, tolera un poco de staleness |
| Write-through | Se requiere consistencia fuerte |
| Lock distribuido | Prevenir acceso concurrente a un recurso |
| Rate limit con sliding window | Throttling preciso por usuario |
| Redis Streams | Queue de eventos durable con consumer groups |
| Pub/Sub | Broadcast sin necesidad de garantías de delivery |
| Sorted Set leaderboard | Scoring rankeado, paginación |
| HyperLogLog | Conteo único aproximado con poca memoria |

## Relacionados

- Skill: `postgres-patterns` — patrones de datos relacionales
- Skill: `backend-patterns` — patrones de API y capa de servicio
- Skill: `database-migrations` — versionado de esquema
- Skill: `django-patterns` — integración con el framework de cache de Django
- Agente: `database-reviewer` — flujo completo de review de base de datos
