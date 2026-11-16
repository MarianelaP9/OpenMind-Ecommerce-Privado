# Proyecto final — Arquitectura de Software

Universidad Autónoma de Chile | Entrega académica de una plataforma de comercio electrónico personalizable.

Esta copia independiente presenta el sistema mediante **EcoCrespo**, una tienda de plantas y accesorios. El entorno de evaluación contiene datos ficticios y no utiliza las cuentas, pedidos ni credenciales de una instalación comercial.

## Ejecutar la aplicación (Windows)

Requisitos: Git, Docker Desktop abierto, Docker Compose v2 y PowerShell.

```powershell
git clone https://github.com/MarianelaP9/OpenMind-Ecommerce-Privado.git
cd OpenMind-Ecommerce-Privado
powershell -ExecutionPolicy Bypass -File .\Iniciar_Arquitectura.ps1
```

El instalador genera claves locales, inicia bases independientes, aplica migraciones y prepara una tienda de ejemplo. Al finalizar muestra el correo y la contraseña local de evaluación. No se requiere ninguna credencial comercial ni cuenta de servicios externos.

- Tienda: http://127.0.0.1:5183/plantilla/2
- Panel del emprendedor: http://127.0.0.1:5183/emprendedor (iniciar sesión con la cuenta mostrada por el instalador)
- Backend: http://127.0.0.1:8010
- Correo de prueba: http://127.0.0.1:8035

Para detener sin borrar los datos:
```powershell
docker compose -p openmind-arquitectura-demo --env-file .env.arquitectura.local -f docker-compose.arquitectura.yml down
```

No eliminar los volúmenes ni el archivo de claves local si se desea conservar la instalación. No usar esta configuración en producción. El instalador se encuentra pendiente de una validación integral en un equipo limpio; los servicios externos y cobros reales no forman parte de esta demostración.

## Arquitectura y tecnologías

React, TypeScript y Vite conforman la capa de presentación; Django y Django REST Framework exponen los servicios HTTP y organizan la lógica de aplicación, dominio e infraestructura. PostgreSQL almacena entidades relacionales y MongoDB el catálogo flexible. Docker Compose orquesta los servicios.

| Componente | Responsabilidad |
| --- | --- |
| `backend/apps/authentication` | Identidad y autenticación |
| `backend/apps/catalog` | Catálogo, variantes e inventario |
| `backend/apps/core` | Tienda, pedidos, pagos y promociones |
| `backend/apps/shipping` | Despachos y retiro |
| `backend/apps/landing` | Contenido y actividades |
| `backend/apps/visual_config` | Plantillas y configuración visual |
| `frontend/src/features` | Interfaces del cliente y emprendedor |
| `docs/` | Documentación técnica y evidencias de desarrollo |

## Documentación

- [Documentación técnica](docs/DOCUMENTACION_TECNICA.md)
- [Requisitos de instalación](docs/requisitos-instalacion.md)
- [Ejecución local general](EJECUCION_LOCAL.md): referencia de la base original; para esta entrega usar el instalador de Arquitectura indicado arriba.

El código base procede del trabajo del equipo OpenMind en Consultoría de Software y se reutiliza en esta entrega independiente de Arquitectura de Software. Se conserva la documentación técnica original como referencia de procedencia. No se afirma que todas las integraciones externas estén disponibles en el entorno de evaluación.

## Seguridad

El entorno de evaluación es exclusivamente local. Los puertos publicados se restringen a la interfaz de loopback, las bases de datos no publican puertos y el correo utiliza Mailpit. La cuenta de demostración y claves se generan localmente. No compartir archivos de entorno ni activar pagos o publicaciones reales para evaluar el proyecto.
