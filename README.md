
# Sistema de Gestión para Forrajería - Testing

## Descripción

En esta parte del proyecto se realizaron mejoras en los tests unitarios del backend para cubrir más casos de uso, errores y situaciones que antes no estaban contempladas.

Las pruebas fueron desarrolladas utilizando el runner nativo de Node.js (`node:test` y `node:assert`), por lo que no fue necesario incorporar librerías externas.

## Tecnologías utilizadas

- Node.js
- Express 5
- PostgreSQL + Prisma ORM
- MongoDB + Mongoose
- Redis
- node:test
- node:assert

## Trabajo realizado

Se agregaron nuevos tests en los siguientes módulos:

- Auth
- Proveedores
- Reportes
- Turnos
- Ventas

En total, el proyecto pasó de **34** a **52** pruebas unitarias, agregando **18 tests** nuevos.

Los módulos **Clientes** y **Productos** no fueron modificados ya que contaban con una cobertura completa.

## Casos agregados

Entre los nuevos tests se incluyeron casos como:

- Validación de credenciales.
- Usuario inactivo.
- Manejo de caché en proveedores.
- Dashboard de reportes.
- Apertura y cierre de turnos.
- Errores en Stored Procedures.
- Procesamiento de ventas.
- Validación de unidades de medida.
- Cálculo de comisiones.

## Ejecución

Desde la carpeta `backend` ejecutar:

```bash
npm test
```

También es posible ejecutar un módulo específico:

```bash
node --test src/modules/auth/auth.test.js
node --test src/modules/ventas/ventas.test.js
node --test src/modules/turnos/turnos.test.js
node --test src/modules/reportes/reportes.test.js
```

Para ejecutar las pruebas con cobertura:

```bash
node --test --experimental-test-coverage src/modules/**/*.test.js
```

## Observaciones

- Los tests utilizan mocks para los DAOs y `redisClient`.
- No es necesario conectarse a una base de datos para ejecutar las pruebas.
- Si en el futuro se agregan nuevos métodos a los DAOs o a Redis, será necesario actualizar los mocks correspondientes.
