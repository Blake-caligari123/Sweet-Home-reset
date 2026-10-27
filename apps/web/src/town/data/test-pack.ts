import { readFileSync } from 'node:fs';
import { validateTownPack } from './area';

/** The bundled Hollowfern pack, validated, for tests (Node only). */
export const hollowfern = validateTownPack(JSON.parse(readFileSync(new URL('../../../public/packs-bundled/hollowfern/1/pack.json', import.meta.url), 'utf8')));
