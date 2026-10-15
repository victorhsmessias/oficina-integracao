import type { Program } from '../ast/types';

export interface CodeGenerator {
  readonly language: string;
  generate(program: Program): string;
}
