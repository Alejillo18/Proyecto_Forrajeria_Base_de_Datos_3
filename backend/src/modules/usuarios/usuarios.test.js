import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosDAO } from './usuarios.dao.js';

describe('Módulo de Usuarios - Pruebas Unitarias (Servicio)', () => {
  const fakeUsuario = {
    id_usuario: '601471c6-6dc2-4a23-ba66-1cac98d82ded',
    email: 'test-empleado@forrajería.com',
    rol: 'Empleado',
    activo: true
  };

  const fakeListaUsuarios = [
    { id_usuario: '1', email: 'admin@test.com', rol: 'Administrador', activo: true },
    { id_usuario: '2', email: 'operario@forrajería.com', rol: 'Empleado', activo: true }
  ];

  beforeEach(() => {
    UsuariosDAO.selectAll = () => Promise.resolve([]);
    UsuariosDAO.selectByEmail = () => Promise.resolve(null);
    UsuariosDAO.insert = () => Promise.resolve(null);
    UsuariosDAO.update = () => Promise.resolve(null);
  });

  test('getAll() - Debería retornar la lista completa de usuarios desde el DAO', async () => {
    UsuariosDAO.selectAll = async () => {
      return fakeListaUsuarios;
    };

    const resultado = await UsuariosService.getAll();
    
    assert.strictEqual(Array.isArray(resultado), true);
    assert.strictEqual(resultado.length, 2);
    assert.strictEqual(resultado[0].email, 'admin@test.com');
    assert.strictEqual(resultado[1].rol, 'Empleado');
  });

  test('create() - Debería encriptar la contraseña con hash e insertar el usuario exitosamente', async () => {
    const inputNuevo = {
      email: 'nuevo@forrajería.com',
      password: 'clavePlana123',
      rol: 'Empleado'
    };

    UsuariosDAO.selectByEmail = async (email) => {
      assert.strictEqual(email, 'nuevo@forrajería.com');
      return null;
    };

    let datosEnviadosAlDAO = null;
    UsuariosDAO.insert = async (data) => {
      datosEnviadosAlDAO = data;
      return { id_usuario: 'uuid-v7-usuario-prueba', ...data };
    };

    const resultado = await UsuariosService.create(inputNuevo);

    assert.strictEqual(resultado.id_usuario, 'uuid-v7-usuario-prueba');
    assert.strictEqual(resultado.email, 'nuevo@forrajería.com');
    assert.notStrictEqual(datosEnviadosAlDAO.password, 'clavePlana123', 'La contraseña debió ser hasheada por el servicio antes de llegar al DAO');
    assert.strictEqual(datosEnviadosAlDAO.password.startsWith('$2b$'), true, 'El hash generado debería cumplir con el formato estándar de bcrypt');
  });

  test('create() - Debería lanzar un error 400 si el email ya se encuentra registrado en el sistema', async () => {
    const inputDuplicado = {
      email: 'admin@test.com',
      password: 'password123',
      rol: 'Empleado'
    };

    UsuariosDAO.selectByEmail = async (email) => {
      return { id_usuario: '1', email, rol: 'Administrador' };
    };

    UsuariosDAO.insert = () => {
      assert.fail('El servicio nunca debería invocar al método insert del DAO si el email está repetido');
    };

    await assert.rejects(
      async () => {
        await UsuariosService.create(inputDuplicado);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, 'El email ya está registrado');
        return true;
      }
    );
  });

  test('update() - Debería aplicar modificaciones y hashear la nueva contraseña si esta viene en el payload', async () => {
    const idTest = '601471c6-6dc2-4a23-ba66-1cac98d82ded';
    const cambios = { rol: 'Administrador', password: 'nuevaClaveSuperSegura' };

    let datosRecibidosPorDAO = null;
    UsuariosDAO.update = async (id, data) => {
      assert.strictEqual(id, idTest);
      datosRecibidosPorDAO = data;
      return { id_usuario: id, email: 'test-empleado@forrajería.com', rol: data.rol, activo: true };
    };

    const resultado = await UsuariosService.update(idTest, cambios);

    assert.strictEqual(resultado.rol, 'Administrador');
    assert.notStrictEqual(datosRecibidosPorDAO.password, 'nuevaClaveSuperSegura', 'La nueva contraseña enviada debió ser transformada en hash');
  });
});