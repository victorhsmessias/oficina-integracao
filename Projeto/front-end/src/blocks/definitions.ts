import * as Blockly from 'blockly/core';
import {
  BlockType,
  CONDITION_OPTIONS,
  IF_CONDITION_FIELD,
  IF_ELSE_INPUT,
  IF_THEN_INPUT,
  REPEAT_BODY_INPUT,
  REPEAT_DEFAULT_TIMES,
  REPEAT_MAX_TIMES,
  REPEAT_MIN_TIMES,
  REPEAT_TIMES_FIELD,
} from './blockTypes';
import { BlockStyle } from './theme';

interface BlockJsonDefinition {
  type: string;
  message0: string;
  args0?: object[];
  message1?: string;
  args1?: object[];
  message2?: string;
  args2?: object[];
  message3?: string;
  args3?: object[];
  previousStatement: null;
  nextStatement: null;
  style: string;
  tooltip: string;
}

const conditionField = {
  type: 'field_dropdown',
  name: IF_CONDITION_FIELD,
  options: CONDITION_OPTIONS.map(([label, sensor]) => [label, sensor]),
};

const statementBlock = (
  type: string,
  message: string,
  style: string,
  tooltip: string,
): BlockJsonDefinition => ({
  type,
  message0: message,
  previousStatement: null,
  nextStatement: null,
  style,
  tooltip,
});

export const blockDefinitions: readonly BlockJsonDefinition[] = [
  statementBlock(
    BlockType.MoveForward,
    'Andar para frente',
    BlockStyle.Movement,
    'O robô anda um passo para frente.',
  ),
  statementBlock(
    BlockType.MoveBackward,
    'Andar para trás',
    BlockStyle.Movement,
    'O robô anda um passo para trás.',
  ),
  statementBlock(
    BlockType.TurnRight,
    'Virar à direita',
    BlockStyle.Turn,
    'O robô gira para a direita.',
  ),
  statementBlock(
    BlockType.TurnLeft,
    'Virar à esquerda',
    BlockStyle.Turn,
    'O robô gira para a esquerda.',
  ),
  {
    ...statementBlock(
      BlockType.Repeat,
      'Repetir %1 vezes',
      BlockStyle.Loop,
      'Repete os blocos de dentro o número de vezes escolhido.',
    ),
    args0: [
      {
        type: 'field_number',
        name: REPEAT_TIMES_FIELD,
        value: REPEAT_DEFAULT_TIMES,
        min: REPEAT_MIN_TIMES,
        max: REPEAT_MAX_TIMES,
        precision: 1,
      },
    ],
    message1: '%1',
    args1: [{ type: 'input_statement', name: REPEAT_BODY_INPUT }],
  },
  {
    ...statementBlock(
      BlockType.If,
      'Se %1 então',
      BlockStyle.Condition,
      'Executa os blocos de dentro somente se a condição for verdadeira.',
    ),
    args0: [conditionField],
    message1: '%1',
    args1: [{ type: 'input_statement', name: IF_THEN_INPUT }],
  },
  {
    ...statementBlock(
      BlockType.IfElse,
      'Se %1 então',
      BlockStyle.Condition,
      'Executa a primeira parte se a condição for verdadeira; senão, executa a segunda.',
    ),
    args0: [conditionField],
    message1: '%1',
    args1: [{ type: 'input_statement', name: IF_THEN_INPUT }],
    message2: 'senão',
    message3: '%1',
    args3: [{ type: 'input_statement', name: IF_ELSE_INPUT }],
  },
];

export function registerBlocks(): void {
  const missing = blockDefinitions.filter((definition) => !Blockly.Blocks[definition.type]);
  if (missing.length > 0) Blockly.common.defineBlocksWithJsonArray([...missing]);
}
