import type { CodeGenerator } from './CodeGenerator';
import { provisionalPortugolGenerator } from './provisionalPortugolGenerator';

export type { CodeGenerator } from './CodeGenerator';

export const codeGenerator: CodeGenerator = provisionalPortugolGenerator;
