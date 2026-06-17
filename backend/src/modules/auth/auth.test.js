import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AuthService } from './auth.service.js';
import { AuthDAO } from './auth.dao.js';

// bcrypt está mockeado: hashSync('x') => 'hashed_x', compare('x', 'hashed_x') => true
const fakeUsuarioDB = {
  id_usuario: '00000000-0000-0000-0000-000000000001',
  email: 'admin@forrajeria.com',
  password: 'hashed_pato123',
  rol: 'Administrador',
  activo: true
};

describe('Módulo Auth — Pruebas de Sesión y Credenciales', () => {

  beforeEach(() => {
    AuthDAO.selectByEmail = () => Promise.resolve(null);
  });

  test('login() — Retorna token y datos del usuario si las credenciales son válidas', async () => {
    AuthDAO.selectByEmail = async () => fakeUsuarioDB;
    const resultado = await AuthService.login({ email: 'admin@forrajeria.com', password: 'pato123' });
    assert.ok(resultado.token);
    assert.strictEqual(resultado.usuario.rol, 'Administrador');
    assert.strictEqual(resultado.usuario.email, 'admin@forrajeria.com');
  });

  test('login() — El payload del usuario incluye exactamente id_usuario, email y rol', async () => {
    AuthDAO.selectByEmail = async () => fakeUsuarioDB;
    const resultado = await AuthService.login({ email: 'admin@forrajeria.com', password: 'pato123' });
    assert.ok(resultado.usuario.id_usuario);
    assert.ok(resultado.usuario.email);
    assert.ok(resultado.usuario.rol);
    assert.strictEqual(Object.keys(resultado.usuario).length, 3);
  });

  test('login() — Lanza 401 si la contraseña no coincide', async () => {
    AuthDAO.selectByEmail = async () => fakeUsuarioDB;
    await assert.rejects(
      () => AuthService.login({ email: 'admin@forrajeria.com', password: 'password_erroneo' }),
      (err) => { assert.strictEqual(err.status, 401); return true; }
    );
  });

  test('login() — Lanza 401 si el email no existe en la base de datos', async () => {
    AuthDAO.selectByEmail = async () => null;
    await assert.rejects(
      () => AuthService.login({ email: 'noexiste@forrajeria.com', password: 'cualquiera' }),
      (err) => { assert.strictEqual(err.status, 401); return true; }
    );
  });

  test('login() — Lanza 401 si el usuario existe pero está inactivo', async () => {
    AuthDAO.selectByEmail = async () => ({ ...fakeUsuarioDB, activo: false });
    await assert.rejects(
      () => AuthService.login({ email: 'admin@forrajeria.com', password: 'pato123' }),
      (err) => { assert.strictEqual(err.status, 401); return true; }
    );
  });

  test('login() — No expone la contraseña hasheada en la respuesta', async () => {
    AuthDAO.selectByEmail = async () => fakeUsuarioDB;
    const resultado = await AuthService.login({ email: 'admin@forrajeria.com', password: 'pato123' });
    assert.strictEqual(resultado.usuario.password, undefined);
  });
});
