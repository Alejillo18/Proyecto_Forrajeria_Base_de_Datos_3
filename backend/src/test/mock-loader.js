/**
 * Mock Loader — intercepta imports problemáticos antes de que se ejecuten.
 * Se carga con: node --import ./src/test/mock-loader.js --test ...
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./mock-hooks.js', pathToFileURL('./src/test/'));
