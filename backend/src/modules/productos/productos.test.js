import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProductosService } from './productos.service.js';
import { ProductosDAO } from './productos.dao.js';
import { redisClient } from '../../../config/db.redis.js';

describe('Módulo de Productos - Pruebas Unitarias (Servicio NoSQL)', () => {

  // Fakes de productos heterogéneos típicos de forrajería
  const fakeAlimentoBolsa = {
    _id: '65f1a2b3c4d5e6f7a8b9c001',
    sku: 'ALIM-PERRO-AD-20KG',
    nombre: 'Alimento Perro Adulto Premium',
    precio_costo: 15000,
    precio_venta_bolsa: 22000,
    precio_venta_kilo: 1500,
    stock_bolsas_cerradas: 50,
    stock_kilos_granel: 10,
    peso_bolsa_kg: 20,
    unidad_medida: 'bolsa',
    id_proveedor: 1,
    activo: true,
    caracteristicas: {
      marca: 'DoguiMax',
      proteinas: '24%',
      sabor: 'Carne y vegetales'
    }
  };

  beforeEach(() => {
    redisClient.get = () => Promise.resolve(null);
    redisClient.set = () => Promise.resolve('OK');
    redisClient.keys = () => Promise.resolve([]);
    redisClient.del = () => Promise.resolve(0);
    ProductosDAO.selectAll = () => Promise.resolve({ datos: [], total: 0 });
    ProductosDAO.selectById = () => Promise.resolve(null);
    ProductosDAO.selectBySku = () => Promise.resolve(null);
    ProductosDAO.insert = () => Promise.resolve(null);
    ProductosDAO.update = () => Promise.resolve(null);
    ProductosDAO.deleteSoft = () => Promise.resolve(null);
    ProductosDAO.updatePricesMassive = () => Promise.resolve({ modifiedCount: 1 });
  });

  // 1. TEST: GET / (Obtener Todos - Catálogo Base desde Mongo)
  test('getAll() - Debería traer datos de MongoDB si Redis está vacío y luego cachear', async () => {
    ProductosDAO.selectAll = async ({ limit, offset }) => {
      assert.strictEqual(limit, 20);
      assert.strictEqual(offset, 0);
      return { datos: [fakeAlimentoBolsa], total: 1 };
    };
    let cacheGuardada = false;
    redisClient.set = async (key, value) => {
      assert.match(key, /^productos:page:1:limit:20/);
      cacheGuardada = true;
      return 'OK';
    };
    const resultado = await ProductosService.getAll({ page: 1, limit: 20 });
    assert.strictEqual(resultado.origen, 'MongoDB');
    assert.strictEqual(resultado.datos.length, 1);
    assert.strictEqual(resultado.datos[0].caracteristicas.proteinas, '24%'); 
    assert.strictEqual(cacheGuardada, true);
  });

  // 2. TEST: GET / (Obtener Todos - Cache Hit)
  test('getAll() - Debería retornar el catálogo desde Redis si ya existe la key', async () => {
    const fakeCache = {
      pag: 1,
      limite: 20,
      total: 1,
      datos: [fakeAlimentoBolsa]
    };

    redisClient.get = async (key) => JSON.stringify(fakeCache);

    ProductosDAO.selectAll = () => {
      assert.fail('No debería consultar MongoDB si los datos ya estaban guardados en RAM');
    };

    const resultado = await ProductosService.getAll({ page: 1, limit: 20 });

    assert.strictEqual(resultado.origen, 'Redis');
    assert.strictEqual(resultado.datos[0].sku, 'ALIM-PERRO-AD-20KG');
  });

  // 3. TEST: GET /?search=... (Búsqueda Predictiva en Tiempo Real)
  test('getAll() - Debería evadir Redis y buscar directo en Mongo si se envía un parámetro de búsqueda', async () => {
    redisClient.get = () => {
      assert.fail('No se debe leer la caché de Redis durante una búsqueda predictiva por texto');
    };

    ProductosDAO.selectAll = async ({ limit, offset, search }) => {
      assert.strictEqual(search, 'Perro');
      return { datos: [fakeAlimentoBolsa], total: 1 };
    };
    const resultado = await ProductosService.getAll({ page: 1, limit: 20, search: 'Perro' });

    assert.strictEqual(resultado.origen, 'MongoDB');
    assert.strictEqual(resultado.datos[0].nombre, 'Alimento Perro Adulto Premium');
  });

  // 4. TEST: POST / (Crear Producto - Camino Feliz e Invalidación)
  test('create() - Debería insertar si el SKU es único y limpiar la caché de productos', async () => {
    ProductosDAO.selectBySku = async (sku) => null;
    
    ProductosDAO.insert = async (inputDB) => {
      return { _id: '65f1a2b3c4d5e6f7a8b9c999', ...inputDB, activo: true };
    };

    let cacheInvalidada = false;
    redisClient.keys = async () => ['productos:page:1:limit:20'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProductosService.create({
      sku: 'ACC-CORREA-ROJA',
      nombre: 'Correa Extensible Roja 3mts',
      precio_costo: 3000,
      unidad_medida: 'unidades',
      id_proveedor: 1,
      caracteristicas: { talle: 'M', color: 'Rojo' }
    });

    assert.strictEqual(resultado.sku, 'ACC-CORREA-ROJA');
    assert.strictEqual(resultado.caracteristicas.color, 'Rojo');
    assert.strictEqual(cacheInvalidada, true);
  });

  // 5. TEST: POST / (Crear Producto - Conflicto de SKU)
  test('create() - Debería lanzar un error de estado 400 si el SKU ya existe', async () => {
    ProductosDAO.selectBySku = async (sku) => fakeAlimentoBolsa;

    await assert.rejects(
      async () => {
        await ProductosService.create({ sku: 'ALIM-PERRO-AD-20KG', nombre: 'Repetido' });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, 'El SKU especificado ya se encuentra registrado');
        return true;
      }
    );
  });

  // 6. TEST: PUT /:id (Inmutabilidad de SKU)
  test('update() - Debería ignorar la modificación del campo SKU para proteger su inmutabilidad', async () => {
    ProductosDAO.update = async (id, data) => {
      assert.strictEqual(data.sku, undefined);
      return { _id: id, ...fakeAlimentoBolsa, precio_venta_bolsa: 25000 };
    };
    const resultado = await ProductosService.update('65f1a2b3c4d5e6f7a8b9c001', {
      precio_venta_bolsa: 25000,
      sku: 'NUEVO-SKU-HACK' 
    });

    assert.strictEqual(resultado.precio_venta_bolsa, 25000);
  });

  // 7. TEST: POST /actualizar-precios (HU-06)
  test('actualizarPreciosMasivo() - Debería invocar la actualización atómica e invalidar Redis', async () => {
    let cacheInvalidada = false;
    let daoLlamado = false;

    ProductosDAO.updatePricesMassive = async (porcentaje) => {
      assert.strictEqual(porcentaje, 10);
      daoLlamado = true;
      return { modifiedCount: 15 };
    };

    redisClient.keys = async () => ['productos:page:1:limit:20'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProductosService.actualizarPreciosMasivo({ porcentaje: 10 });
    
    assert.strictEqual(daoLlamado, true);
    assert.strictEqual(cacheInvalidada, true);
    assert.strictEqual(resultado.modifiedCount, 15);
  });

  // 8. TEST: POST /ajuste/:id (HU-07 Egreso Feliz)
  test('ajustarInventarioManual() - Debería procesar mermas restando stock de la unidad correcta', async () => {
    let daoUpdateLlamado = false;
    ProductosDAO.selectById = async () => fakeAlimentoBolsa;
    
    ProductosDAO.update = async (id, data) => {
      assert.strictEqual(id, '65f1a2b3c4d5e6f7a8b9c001');
      assert.strictEqual(data.stock_bolsas_cerradas, 48); // 50 inicial - 2 egreso
      daoUpdateLlamado = true;
      return { ...fakeAlimentoBolsa, stock_bolsas_cerradas: 48 };
    };

    const resultado = await ProductosService.ajustarInventarioManual('65f1a2b3c4d5e6f7a8b9c001', {
      cantidad: 2,
      unidad: 'bolsa',
      tipo_ajuste: 'egreso',
      motivo: 'Rotura de bolsa por manipulación'
    });

    assert.strictEqual(daoUpdateLlamado, true);
    assert.strictEqual(resultado.ajuste.tipo_ajuste, 'egreso');
    assert.strictEqual(resultado.producto.stock_bolsas_cerradas, 48);
  });

  // 9. TEST: POST /ajuste/:id (HU-07 Error por Stock Insuficiente)
  test('ajustarInventarioManual() - Debería arrojar error 400 si el egreso manual supera el stock actual', async () => {
    ProductosDAO.selectById = async () => fakeAlimentoBolsa; // tacho a granel inicial: 10 kg

    await assert.rejects(
      async () => {
        await ProductosService.ajustarInventarioManual('65f1a2b3c4d5e6f7a8b9c001', {
          cantidad: 15,
          unidad: 'kilo',
          tipo_ajuste: 'egreso',
          motivo: 'Regalo a empleado'
        });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Stock insuficiente/);
        return true;
      }
    );
  });
});