# Charly Bot - Robot Bartender

Aplicación web de control para robot bartender automatizado. Sistema de preparación de cócteles controlado vía Modbus TCP.

## Características

- 🍹 Selección de cócteles con interfaz moderna
- 🤖 Monitoreo en tiempo real del estado del robot
- 📊 Visualización del progreso de preparación
- 🔌 Comunicación Modbus TCP con el robot
- ⚡ Actualizaciones en vivo cada segundo

## Requisitos previos

- Node.js 18+ y pnpm
- Robot industrial con servidor Modbus TCP
- Red local para comunicación con el robot

## Instalación

1. **Clonar e instalar dependencias:**

```bash
pnpm install
```

2. **Configurar conexión Modbus:**

Copia el archivo de ejemplo y configura la IP de tu robot:

```bash
cp .env.example .env
```

Edita `.env` y actualiza `MODBUS_HOST`:

```env
MODBUS_HOST=192.168.1.100  # IP de tu robot
MODBUS_PORT=502
MODBUS_UNIT_ID=1
```

3. **Verificar conexión:**

```bash
node scripts/test-modbus-support.js
```

📖 **Ver documentación completa:** [MODBUS_SETUP.md](./MODBUS_SETUP.md)

## Desarrollo

Inicia el servidor de desarrollo:

```bash
pnpm dev

# o abre automáticamente en el navegador
pnpm dev -- --open
```

## Comandos disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Vista previa del build
pnpm check        # Verificación de tipos
pnpm check:watch  # Verificación en modo watch
```

## Estructura del proyecto

```
src/
├── lib/
│   ├── components/         # Componentes Svelte
│   │   ├── CocktailCard.svelte
│   │   ├── StatusMonitor.svelte
│   │   └── ProgressIndicator.svelte
│   ├── data/
│   │   └── cocktails.js    # Definición de cócteles
│   ├── services/
│   │   └── modbusClient.js # Cliente Modbus
│   └── stores/
│       └── cocktailStatus.js
├── routes/
│   ├── api/
│   │   ├── cocktails/[id]/ # Endpoint para iniciar cócteles
│   │   └── status/         # Endpoint de estado del robot
│   └── +page.svelte        # Página principal
└── scripts/
    └── test-modbus-support.js  # Diagnóstico Modbus
```

## Cócteles disponibles

- 🍃 **Mojito** (Dirección Modbus: 100)
- 🇨🇺 **Cuba Libre** (Dirección Modbus: 101)
- 🥃 **Cubata** (Dirección Modbus: 102)
- 🧊 **Whiskey on the Rocks** (Dirección Modbus: 103)
- 🥤 **Whiskey and Coke** (Dirección Modbus: 104)
- 🍸 **Whiskey Highball** (Dirección Modbus: 105)
- ✨ **Personalizar tu trago** (Dirección Modbus: 106)

### Direcciones Modbus - Ingredientes

| Ingrediente | Dirección | Descripción |
|------------|-----------|-------------|
| Mint | 132 | Hojas de menta |
| Muddling | 133 | Macerar (automático con mint) |
| Ice | 134 | Hielo |
| Syrup | 135 | Jarabe |
| Lime | 136 | Lima |
| White Rum | 137 | Ron blanco |
| Dark Rum | 138 | Ron oscuro |
| Whiskey | 139 | Whisky |
| Soda | 140 | Soda |
| Coke | 141 | Coca-Cola |
| Stirring | 142 | Revolver (automático con soda/coke) |
| Straw | 143 | Pajita (automático con soda/coke) |

### Flujo de preparación

**Tragos predefinidos:**
1. Usuario selecciona un cóctel (ej: Mojito)
2. Sistema escribe en todas las direcciones de ingredientes de la receta
3. Sistema escribe en la dirección del trago (100-105)
4. Sistema escribe en la dirección 96 (Start Signal)
5. Robot prepara el cóctel

**Trago personalizado:**
1. Usuario selecciona ingredientes (máx 2 alcoholes, 1 mixer)
2. Sistema escribe en las direcciones de cada ingrediente seleccionado
3. Sistema automáticamente agrega:
   - Muddling (133) si hay Mint
   - Stirring (142) y Straw (143) si hay Soda o Coke
4. Sistema escribe en la dirección 106 (Custom)
5. Sistema escribe en la dirección 96 (Start Signal)
6. Robot prepara el trago personalizado

### Restricciones de personalización

- **Alcoholes:** Máximo 2 (White Rum, Dark Rum o Whiskey)
- **Mixers:** Máximo 1 (Soda o Coke)
- **Otros:** Sin límite (Mint, Ice, Syrup, Lime)

## Troubleshooting

### Error de conexión (ECONNREFUSED)

```
Error: connect ECONNREFUSED 127.0.0.1:502
```

**Soluciones:**
1. Verifica que el robot esté encendido
2. Confirma la IP correcta en `.env`
3. Prueba `ping` a la IP del robot
4. Verifica que el puerto 502 esté accesible

### Para desarrollo sin robot físico

Usa un simulador Modbus. Ver [MODBUS_SETUP.md](./MODBUS_SETUP.md#modo-de-prueba-sin-robot) para opciones.

## Tecnologías

- **Frontend:** SvelteKit 5, TailwindCSS, DaisyUI
- **Backend:** SvelteKit API Routes
- **Comunicación:** modbus-serial (Modbus TCP)
- **Package Manager:** pnpm

## Licencia

MIT
