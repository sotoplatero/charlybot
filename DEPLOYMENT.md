# Guía de Deployment en Dokku

Esta guía te ayudará a desplegar la aplicación Bartender en un servidor Dokku.

## Requisitos Previos

- Servidor Dokku instalado y configurado
- Acceso SSH al servidor Dokku
- Git instalado localmente
- El robot bartender debe estar accesible en la misma red local que el servidor Dokku

## Configuración Inicial en el Servidor Dokku

### 1. Crear la Aplicación

Conéctate a tu servidor Dokku vía SSH y ejecuta:

```bash
dokku apps:create bartender
```

### 2. Configurar Variables de Entorno

Configura las variables de entorno necesarias para la conexión Modbus y OpenAI:

```bash
# IP del robot bartender en tu red local
dokku config:set bartender MODBUS_HOST=192.168.1.100

# Puerto Modbus TCP (por defecto 502)
dokku config:set bartender MODBUS_PORT=502

# Unit ID del dispositivo Modbus (por defecto 1)
dokku config:set bartender MODBUS_UNIT_ID=1

# Timeout de conexión en milisegundos (por defecto 2000)
dokku config:set bartender MODBUS_TIMEOUT=2000

# OpenAI API Key para reconocimiento de voz con Whisper
dokku config:set bartender OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Notas:**
- Ajusta `MODBUS_HOST` a la IP real de tu robot en la red local.
- Obtén tu `OPENAI_API_KEY` en https://platform.openai.com/api-keys

### 3. Configurar Dominio (Opcional)

Si quieres usar un dominio personalizado:

```bash
dokku domains:add bartender bartender.tudominio.com
```

### 4. Habilitar Checks de Salud

Los health checks están configurados automáticamente en el archivo `CHECKS`. Dokku los ejecutará automáticamente durante el deployment.

## Configuración Local

### 1. Agregar el Remote de Dokku

En tu máquina local, dentro del directorio del proyecto, agrega el remote de Dokku:

```bash
git remote add dokku dokku@tu-servidor.com:bartender
```

Reemplaza `tu-servidor.com` con la dirección de tu servidor Dokku.

### 2. Verificar Configuración

Verifica que el remote se agregó correctamente:

```bash
git remote -v
```

Deberías ver algo como:

```
dokku   dokku@tu-servidor.com:bartender (fetch)
dokku   dokku@tu-servidor.com:bartender (push)
origin  https://github.com/tu-usuario/bartender.git (fetch)
origin  https://github.com/tu-usuario/bartender.git (push)
```

## Deployment

### Opción 1: Deployment Automático con el Script

El proyecto incluye un comando `deploy` que ejecuta todos los pasos necesarios:

```bash
pnpm run deploy
```

Este comando:
1. Ejecuta `pnpm check` para validar tipos
2. Ejecuta `pnpm build` para verificar que compile correctamente
3. Hace `git push dokku main` para desplegar

### Opción 2: Deployment Manual

Si prefieres hacerlo manualmente:

```bash
# 1. Asegúrate de que todos los cambios estén committed
git add .
git commit -m "Preparar para deployment"

# 2. Push a Dokku
git push dokku main
```

## Monitoreo Post-Deployment

### Ver Logs en Tiempo Real

```bash
ssh dokku@tu-servidor.com logs bartender -t
```

### Verificar el Estado de la Aplicación

```bash
ssh dokku@tu-servidor.com ps:report bartender
```

### Verificar Health Check

Una vez desplegada, verifica que la aplicación responda correctamente:

```bash
curl https://bartender.tudominio.com/api/health
```

Deberías recibir una respuesta JSON con el estado de la aplicación y la conexión Modbus.

## Prueba de Conectividad Modbus

Después del deployment, es importante verificar que la aplicación puede conectarse al robot:

1. Abre la aplicación en el navegador: `https://bartender.tudominio.com`
2. Navega a `/modbus-test` para probar la conectividad
3. Verifica que el estado muestre "Conectado"

## Configuración de Red

### Importante: Acceso al Robot Modbus

El contenedor de Dokku debe poder acceder al robot en el puerto 502 (Modbus TCP). Considera:

- **Firewall:** Asegúrate de que el firewall del servidor permita conexiones salientes al puerto 502
- **Red:** El servidor Dokku y el robot deben estar en la misma red local o tener rutas configuradas
- **IP Estática:** Se recomienda que el robot tenga una IP estática o usar DNS interno

### Verificar Conectividad desde el Contenedor

Para probar la conectividad desde el contenedor de Dokku:

```bash
ssh dokku@tu-servidor.com run bartender nc -zv MODBUS_HOST 502
```

Reemplaza `MODBUS_HOST` con la IP real del robot.

## Troubleshooting

### La Aplicación no Inicia

1. Verifica los logs:
   ```bash
   ssh dokku@tu-servidor.com logs bartender
   ```

2. Verifica que todas las variables de entorno estén configuradas:
   ```bash
   ssh dokku@tu-servidor.com config bartender
   ```

### Error de Conexión Modbus

Si la aplicación no puede conectarse al robot:

1. Verifica la IP del robot:
   ```bash
   ssh dokku@tu-servidor.com config:get bartender MODBUS_HOST
   ```

2. Prueba la conectividad de red desde el servidor:
   ```bash
   ssh tu-servidor.com
   telnet IP_DEL_ROBOT 502
   ```

3. Verifica el firewall del servidor y del robot

### Build Falla

Si el build falla durante el deployment:

1. Verifica que el build funcione localmente:
   ```bash
   pnpm build
   ```

2. Verifica los logs del build en Dokku:
   ```bash
   ssh dokku@tu-servidor.com logs bartender --build
   ```

### Rollback a una Versión Anterior

Si necesitas volver a una versión anterior:

```bash
ssh dokku@tu-servidor.com ps:rebuild bartender
```

## Actualización de la Aplicación

Para actualizar la aplicación después de hacer cambios:

```bash
# 1. Commit tus cambios
git add .
git commit -m "Descripción de los cambios"

# 2. Deploy
pnpm run deploy
```

## Mantenimiento

### Reiniciar la Aplicación

```bash
ssh dokku@tu-servidor.com ps:restart bartender
```

### Rebuild de la Aplicación

```bash
ssh dokku@tu-servidor.com ps:rebuild bartender
```

### Eliminar Variables de Entorno

```bash
ssh dokku@tu-servidor.com config:unset bartender NOMBRE_VARIABLE
```

## Recursos Adicionales

- [Documentación de Dokku](https://dokku.com/docs/)
- [SvelteKit Adapter Node](https://kit.svelte.dev/docs/adapter-node)
- [Modbus TCP/IP Protocol](https://www.modbus.org/)

## Soporte

Si encuentras problemas durante el deployment, verifica:

1. Los logs de la aplicación
2. Las variables de entorno
3. La conectividad de red al robot
4. La versión de Node.js en el servidor (debe ser compatible con el proyecto)
