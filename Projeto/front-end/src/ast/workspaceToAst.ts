import type * as Blockly from 'blockly/core';
import {
  BlockType,
  IF_CONDITION_FIELD,
  IF_ELSE_INPUT,
  IF_THEN_INPUT,
  MOVE_BLOCK_DIRECTIONS,
  REPEAT_BODY_INPUT,
  REPEAT_TIMES_FIELD,
} from '../blocks/blockTypes';
import { isSensor, type If, type Program, type Repeat, type Statement } from './types';

export function workspaceToAst(workspace: Blockly.Workspace): Program {
  const body = workspace
    .getTopBlocks(true)
    .flatMap((topBlock) => stackToStatements(topBlock));

  return { type: 'program', body };
}

function stackToStatements(firstBlock: Blockly.Block | null): Statement[] {
  const statements: Statement[] = [];

  for (let block = firstBlock; block; block = block.getNextBlock()) {
    if (!isActive(block)) continue;

    const statement = blockToStatement(block);
    if (statement) statements.push(statement);
  }

  return statements;
}

function isActive(block: Blockly.Block): boolean {
  return block.isEnabled() && !block.isInsertionMarker();
}

function blockToStatement(block: Blockly.Block): Statement | null {
  const direction = MOVE_BLOCK_DIRECTIONS[block.type];
  if (direction) return { type: 'move', direction };

  if (block.type === BlockType.Repeat) return repeatBlockToStatement(block);
  if (block.type === BlockType.If || block.type === BlockType.IfElse) return ifBlockToStatement(block);

  return null;
}

function repeatBlockToStatement(block: Blockly.Block): Repeat {
  return {
    type: 'repeat',
    times: parseTimes(block.getFieldValue(REPEAT_TIMES_FIELD)),
    body: stackToStatements(block.getInputTargetBlock(REPEAT_BODY_INPUT)),
  };
}

function ifBlockToStatement(block: Blockly.Block): If | null {
  const sensor: unknown = block.getFieldValue(IF_CONDITION_FIELD);
  if (!isSensor(sensor)) return null;

  const statement: If = {
    type: 'if',
    condition: { type: 'sensor', sensor },
    thenBody: stackToStatements(block.getInputTargetBlock(IF_THEN_INPUT)),
  };

  if (block.type === BlockType.IfElse) {
    statement.elseBody = stackToStatements(block.getInputTargetBlock(IF_ELSE_INPUT));
  }

  return statement;
}

function parseTimes(value: unknown): number {
  const times = Math.floor(Number(value));
  return Number.isFinite(times) && times > 0 ? times : 0;
}
