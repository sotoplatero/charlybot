# Configuración Modbus

## Conexión al Robot

Este proyecto se conecta a un robot industrial vía Modbus TCP. Sigue estos pasos para configurar la conexión:

### 1. Crear archivo de configuración

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar la IP del robot

Edita el archivo `.env` y actualiza `MODBUS_HOST` con la dirección IP de tu robot:

```env
MODBUS_HOST=192.168.1.100  # Cambia esto a la IP de tu robot
MODBUS_PORT=502
MODBUS_UNIT_ID=1
MODBUS_TIMEOUT=3000
```

### 3. Verificar la conexión

Ejecuta el script de diagnóstico para verificar que puedes conectarte al robot:

```bash
# Primero, actualiza el script para usar las variables de entorno
node scripts/test-modbus-support.js
```

## Direcciones Modbus

### Direcciones de ingredientes (132-143)
| Dirección | Ingrediente | Tipo | Notas |
|-----------|-------------|------|-------|
| 132 | Mint | Coil (Write) | - |
| 133 | Muddling | Coil (Write) | Automático cuando se selecciona Mint |
| 134 | Ice | Coil (Write) | - |
| 135 | Syrup | Coil (Write) | - |
| 136 | Lime | Coil (Write) | - |
| 137 | White Rum | Coil (Write) | - |
| 138 | Dark Rum | Coil (Write) | - |
| 139 | Whiskey | Coil (Write) | - |
| 140 | Soda | Coil (Write) | - |
| 141 | Coke | Coil (Write) | - |
| 142 | Stirring | Coil (Write) | Automático cuando se selecciona Soda o Coke |
| 143 | Straw | Coil (Write) | Automático cuando se selecciona Soda o Coke |

### Direcciones del sistema (90-96)
| Dirección | Descripción | Tipo | Notas |
|-----------|-------------|------|-------|
| 90 | Cup Holder | Discrete Input/Coil | - |
| 91 | Drink Ready | Discrete Input/Coil | - |
| 92 | Waiting Recipe | Discrete Input/Coil | - |
| 96 | Start Signal | Coil (Write) | Indica al robot que puede comenzar |

### Direcciones de cócteles (100-106)
| Dirección | Cóctel | Tipo |
|-----------|--------|------|
| 100 | Mojito | Coil (Write) |
| 101 | Cuba Libre | Coil (Write) |
| 102 | Cubata | Coil (Write) |
| 103 | Whiskey on the Rocks | Coil (Write) |
| 104 | Whiskey and Coke | Coil (Write) |
| 105 | Whiskey Highball | Coil (Write) |
| 106 | Custom (Personalizado) | Coil (Write) |

## Flujo de operación

### Tragos predefinidos (100-105)
1. **Usuario selecciona un cóctel** → Sistema escribe en las direcciones de todos los ingredientes de la receta
2. **Sistema escribe en dirección del cóctel** → Se escribe `1` en la dirección del cóctel (100-105)
3. **Sistema escribe en dirección 96** → Se escribe `1` para indicar al robot que puede comenzar
4. **Robot prepara** → El robot ejecuta la receta completa
5. **Drink Ready** → Cuando la dirección 91 se activa, el cóctel está listo
6. **Reset automático** → Todas las direcciones de cócteles (100-106) se resetean a 0

### Trago personalizado (106)
1. **Usuario selecciona ingredientes** → Máximo 2 alcoholes y 1 mixer
2. **Sistema escribe ingredientes** → Se escribe `1` en cada dirección de ingrediente seleccionado
3. **Sistema agrega automáticamente:**
   - Muddling (133) si se seleccionó Mint
   - Stirring (142) y Straw (143) si se seleccionó Soda o Coke
4. **Sistema escribe en dirección 106** → Se escribe `1` en la dirección Custom
5. **Sistema escribe en dirección 96** → Se escribe `1` para indicar al robot que puede comenzar
6. **Robot prepara** → El robot ejecuta la combinación personalizada
7. **Drink Ready** → Cuando la dirección 91 se activa, el trago está listo
8. **Reset automático** → Todas las direcciones se resetean a 0

## Troubleshooting

### Error: ECONNREFUSED

Si ves este error:
```
Error: connect ECONNREFUSED 127.0.0.1:502
```

**Soluciones:**
1. Verifica que el robot esté encendido y conectado a la red
2. Verifica que `MODBUS_HOST` en `.env` tenga la IP correcta del robot
3. Prueba hacer ping al robot: `ping 192.168.1.100`
4. Verifica que el puerto 502 esté abierto en el firewall

### Error: ETIMEDOUT

Si la conexión se agota:
- Aumenta `MODBUS_TIMEOUT` en `.env` (por ejemplo, a 5000)
- Verifica que no haya problemas de red
- Reduce la frecuencia de polling si es necesario

### Direcciones no soportadas

Si ves errores de "Illegal data address":
1. Ejecuta `node scripts/test-modbus-support.js` para ver qué direcciones soporta tu dispositivo
2. Ajusta las direcciones en el código según lo que soporte tu robot
3. Verifica la documentación de tu robot para confirmar las direcciones

## Modo de prueba (sin robot)

Para desarrollar sin un robot físico, puedes usar un simulador Modbus:

### Opción 1: ModbusPal (GUI)
1. Descarga ModbusPal: https://modbuspal.sourceforge.net/
2. Configura un servidor en puerto 502
3. Agrega las direcciones 32-40, 90-92, 100-106

### Opción 2: pyModbusTCP (Python)
```python
from pyModbusTCP.server import ModbusServer

server = ModbusServer("127.0.0.1", 502, no_block=True)
server.start()
print("Modbus server running on port 502")
```

### Opción 3: Docker
```bash
docker run -d -p 502:502 oitc/modbus-server
```

Después de iniciar el simulador, verifica que `.env` tenga:
```env
MODBUS_HOST=localhost
```
