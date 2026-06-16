import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { VendedoresService } from './vendedores.service.js';
import { VendedoresDAO } from './vendedores.dao.js';

describe('Módulo de Vendedores - Pruebas Unitarias (Servicio)', () => {
  const fakeVendedor = {
    id_vendedor: '00000000-0000-0000-0000-000000000005',
    nombre_vendedor: 'Vendedor Mostrador 1',
    comision_porcentaje: 3.5,
    activo: true
  };

  beforeEach(() => {
    VendedoresDAO.selectAll = () => Promise.resolve([]);
    VendedoresDAO.insert = () => Promise.resolve(null);
    VendedoresDAO.update = () => Promise.resolve(null);
  });

  test('getAll() - Debería retornar la lista de comisionistas ordenada desde el DAO', async () => {
    const listaMock = [
      { id_vendedor: '1', nombre_vendedor: 'Aníbal', comision_porcentaje: 2.0 },
      { id_vendedor: '2', nombre_vendedor: 'Beatriz', comision_porcentaje: 5.0 }
    ];

    VendedoresDAO.selectAll = async () => {
      return listaMock;
    };

    const resultado = await VendedoresService.getAll();

    assert.strictEqual(Array.isArray(resultado), true);
    assert.strictEqual(resultado.length, 2);
    assert.strictEqual(resultado[0].nombre_vendedor, 'Aníbal');
    assert.strictEqual(resultado[1].comision_porcentaje, 5.0);
  });

  test('create() - Debería registrar el comisionista parseando correctamente el porcentaje decimal', async () => {
    const inputNuevo = {
      nombre_vendedor: 'Esteban Quito',
      comision_porcentaje: '4.5' // Lo pasamos como string para simular la captura de los inputs
    };

    VendedoresDAO.insert = async (data) => {
      assert.strictEqual(data.nombre_vendedor, 'Esteban Quito');
      assert.strictEqual(data.comision_porcentaje, 4.5); // Valida el parseFloat del servicio
      return { id_vendedor: 'uuid-v7-vendedor-prueba', ...data, activo: true };
    };

    const resultado = await VendedoresService.create(inputNuevo);

    assert.strictEqual(resultado.id_vendedor, 'uuid-v7-vendedor-prueba');
    assert.strictEqual(resultado.nombre_vendedor, 'Esteban Quito');
    assert.strictEqual(resultado.comision_porcentaje, 4.5);
  });

  test('create() - Debería arrojar un error 400 si el campo nombre_vendedor no viene en la petición', async () => {
    const inputInvalido = {
      comision_porcentaje: 2.5
    };

    VendedoresDAO.insert = () => {
      assert.fail('El DAO jamás debería ser consultado si el nombre obligatorio no está presente');
    };

    await assert.rejects(
      async () => {
        await VendedoresService.create(inputInvalido);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, 'El nombre del vendedor es requerido');
        return true;
      }
    );
  });

  test('update() - Debería modificar parcialmente campos numéricos y de texto mediante el DAO', async () => {
    const idTarget = '00000000-0000-0000-0000-000000000005';
    const camposModificados = {
      nombre_vendedor: 'Juan Carlos Mostrador',
      comision_porcentaje: '6.2'
    };

    VendedoresDAO.update = async (id, data) => {
      assert.strictEqual(id, idTarget);
      assert.strictEqual(data.nombre_vendedor, 'Juan Carlos Mostrador');
      assert.strictEqual(data.comision_porcentaje, 6.2);
      return { id_vendedor: id, ...data, activo: true };
    };

    const resultado = await VendedoresService.update(idTarget, camposModificados);

    assert.strictEqual(resultado.id_vendedor, idTarget);
    assert.strictEqual(resultado.nombre_vendedor, 'Juan Carlos Mostrador');
    assert.strictEqual(resultado.comision_porcentaje, 6.2);
  });
});