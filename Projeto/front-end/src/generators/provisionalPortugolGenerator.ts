import type { Condition, Direction, Statement, Program } from '../ast/types';
import type { CodeGenerator } from './CodeGenerator';

const INDENT = '\t';

const MOVE_CALLS: Record<Direction, string> = {
  forward: 'andarParaFrente()',
  backward: 'andarParaTras()',
  right: 'virarDireita()',
  left: 'virarEsquerda()',
};

const CONDITION_CALLS: Record<Condition['sensor'], string> = {
  obstacleAhead: 'obstaculoAFrente()',
  obstacleRight: 'obstaculoADireita()',
  obstacleLeft: 'obstaculoAEsquerda()',
};

const LOOP_VARIABLES = ['i', 'j', 'k', 'l', 'm', 'n'];

export function loopVariable(depth: number): string {
  return LOOP_VARIABLES[depth] ?? `i${depth + 1}`;
}

function indent(level: number): string {
  return INDENT.repeat(level);
}

function generateBlock(statements: Statement[], level: number, loopDepth: number): string[] {
  return statements.flatMap((statement) => generateStatement(statement, level, loopDepth));
}

function generateStatement(statement: Statement, level: number, loopDepth: number): string[] {
  const pad = indent(level);

  switch (statement.type) {
    case 'move':
      return [`${pad}${MOVE_CALLS[statement.direction]}`];

    case 'repeat': {
      const variable = loopVariable(loopDepth);
      return [
        `${pad}para (inteiro ${variable} = 1; ${variable} <= ${statement.times}; ${variable}++)`,
        `${pad}{`,
        ...generateBlock(statement.body, level + 1, loopDepth + 1),
        `${pad}}`,
      ];
    }

    case 'if':
      return [
        `${pad}se (${CONDITION_CALLS[statement.condition.sensor]})`,
        `${pad}{`,
        ...generateBlock(statement.thenBody, level + 1, loopDepth),
        `${pad}}`,
        ...(statement.elseBody
          ? [
              `${pad}senao`,
              `${pad}{`,
              ...generateBlock(statement.elseBody, level + 1, loopDepth),
              `${pad}}`,
            ]
          : []),
      ];
  }
}

export const provisionalPortugolGenerator: CodeGenerator = {
  language: 'Portugol',
  generate(program: Program): string {
    return [
      '// Código gerado automaticamente (gerador PROVISÓRIO)',
      'programa',
      '{',
      `${indent(1)}funcao inicio()`,
      `${indent(1)}{`,
      ...generateBlock(program.body, 2, 0),
      `${indent(1)}}`,
      '}',
    ].join('\n');
  },
};
