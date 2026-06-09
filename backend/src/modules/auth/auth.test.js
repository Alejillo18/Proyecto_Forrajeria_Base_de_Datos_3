import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AuthService } from './auth.service.js';
import { AuthDAO } from './auth.dao.js';
import bcrypt from 'bcrypt';

describe('Módulo de Autenticación - Pruebas de Sesión y Criptografía', () => {

  const fakePasswordHash = bcrypt.hashSync('pato123', 10);
  
  const fakeUsuarioDB = {
    id_usuario: '00000000-0000-0000-0000-000000000001',
    email: 'admin@forrajería.com',
    password: fakePasswordHash,
    rol: 'Administrador',
    activo: true
  };

  beforeEach(() => {
    AuthDAO.selectByEmail = () => Promise.resolve(null);
  });

  test('login() - Debería retornar un JWT firmado si las credenciales son válidas', async () => {
    AuthDAO.selectByEmail = async (email) => fakeUsuarioDB;

    const resultado = await AuthService.login({
      email: 'admin@forrajería.com',
      password: 'pato123'
    });

    assert.ok(resultado.token);
    assert.strictEqual(resultado.usuario.rol, 'Administrador');
    assert.strictEqual(resultado.usuario.email, 'admin@forrajería.com');
  });

  test('login() - Debería lanzar error 401 si la contraseña no coincide', async () => {
    AuthDAO.selectByEmail = async (email) => fakeUsuarioDB;

    await assert.rejects(
      async () => {
        await AuthService.login({ email: 'admin@forrajería.com', password: 'password_erroneo' });
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.message, 'Credenciales incorrectas');
        return true;
      }
    );
  });
});