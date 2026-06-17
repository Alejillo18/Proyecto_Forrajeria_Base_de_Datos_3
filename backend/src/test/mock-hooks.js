const MOCKED_MODULES = new Set([
  'redis', 'bcrypt', 'mongoose', 'jsonwebtoken',
  '@prisma/client', '@prisma/adapter-pg', 'pg', 'dotenv',
]);

export async function resolve(specifier, context, nextResolve) {
  if (MOCKED_MODULES.has(specifier)) {
    return { shortCircuit: true, url: `node:mock:${specifier}` };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith('node:mock:')) return nextLoad(url, context);

  const pkg = url.replace('node:mock:', '');

  const mocks = {
    'redis': `
      export function createClient() {
        return {
          get: async () => null, set: async () => 'OK',
          del: async () => 0, keys: async () => [],
          connect: async () => {}, on: () => {},
        };
      }
    `,
    'bcrypt': `
      export async function hash(pwd) { return 'hashed_' + pwd; }
      export async function compare(pwd, hash) { return hash === 'hashed_' + pwd; }
      export function hashSync(pwd) { return 'hashed_' + pwd; }
      export function compareSync(pwd, hash) { return hash === 'hashed_' + pwd; }
      export default { hash, compare, hashSync, compareSync };
    `,
    'mongoose': `
      const Types = {
        Mixed: {}, ObjectId: {}, String, Number, Boolean, Date, Map, Array,
      };

      const Schema = function(definition, opts) {};
      Schema.prototype.index = function() {};
      Schema.Types = Types;

      function model(name, schema) {
        return {
          find: () => ({
            skip: () => ({ limit: () => ({ sort: async () => [] }) })
          }),
          findOne: async () => null,
          findById: async () => null,
          findOneAndUpdate: async () => null,
          countDocuments: async () => 0,
          save: async function() { return this; },
        };
      }

      const mongoose = { Schema, model, connect: async () => {} };
      export { Schema, model };
      export default mongoose;
    `,
    'jsonwebtoken': `
      export function sign(payload, secret, opts) { return 'fake.jwt.token'; }
      export function verify(token, secret) { return { id: 1 }; }
      export default { sign, verify };
    `,
    '@prisma/client': `
      export const PrismaClient = class {
        constructor() {}
        $connect() { return Promise.resolve(); }
        $disconnect() { return Promise.resolve(); }
      };
    `,
    '@prisma/adapter-pg': `
      export const PrismaPg = class { constructor() {} };
    `,
    'pg': `
      export const Pool = class {
        constructor() {}
        query() { return Promise.resolve({ rows: [] }); }
        on() {}
      };
      export default { Pool };
    `,
    'dotenv': `
      export function config() {}
      export default { config };
    `,
  };

  return {
    shortCircuit: true,
    format: 'module',
    source: mocks[pkg] ?? `export default {};`,
  };
}