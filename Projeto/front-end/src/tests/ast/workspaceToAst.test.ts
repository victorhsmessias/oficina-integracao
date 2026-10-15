import * as Blockly from 'blockly/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { workspaceToAst } from '../../ast';
import { BlockType, registerBlocks } from '../../blocks';

interface BlockState {
  type: string;
  x?: number;
  y?: number;
  fields?: Record<string, number | string>;
  inputs?: Record<string, { block: BlockState }>;
  next?: { block: BlockState };
}

const chain = (first: BlockState, ...rest: BlockState[]): BlockState =>
  rest.length === 0 ? first : { ...first, next: { block: chain(rest[0], ...rest.slice(1)) } };

const forward = (): BlockState => ({ type: BlockType.MoveForward });
const backward = (): BlockState => ({ type: BlockType.MoveBackward });
const right = (): BlockState => ({ type: BlockType.TurnRight });
const left = (): BlockState => ({ type: BlockType.TurnLeft });
const repeat = (times: number, ...body: BlockState[]): BlockState => ({
  type: BlockType.Repeat,
  fields: { TIMES: times },
  ...(body.length > 0 ? { inputs: { DO: { block: chain(body[0], ...body.slice(1)) } } } : {}),
});

const ifThen = (sensor: string, ...thenBody: BlockState[]): BlockState => ({
  type: BlockType.If,
  fields: { CONDITION: sensor },
  ...(thenBody.length > 0 ? { inputs: { THEN: { block: chain(thenBody[0], ...thenBody.slice(1)) } } } : {}),
});

const ifElse = (sensor: string, thenBody: BlockState[], elseBody: BlockState[]): BlockState => {
  const inputs: Record<string, { block: BlockState }> = {};
  if (thenBody.length > 0) inputs.THEN = { block: chain(thenBody[0], ...thenBody.slice(1)) };
  if (elseBody.length > 0) inputs.ELSE = { block: chain(elseBody[0], ...elseBody.slice(1)) };
  return { type: BlockType.IfElse, fields: { CONDITION: sensor }, inputs };
};

describe('workspaceToAst', () => {
  let workspace: Blockly.Workspace;

  const load = (...topBlocks: BlockState[]) =>
    Blockly.serialization.workspaces.load(
      { blocks: { languageVersion: 0, blocks: topBlocks } },
      workspace,
    );

  beforeAll(() => {
    registerBlocks();
    Blockly.common.defineBlocksWithJsonArray([
      { type: 'test_unknown', message0: 'desconhecido', previousStatement: null, nextStatement: null },
    ]);
  });

  beforeEach(() => {
    workspace = new Blockly.Workspace();
  });

  afterEach(() => {
    workspace.dispose();
  });

  it('returns an empty program for an empty workspace', () => {
    expect(workspaceToAst(workspace)).toEqual({ type: 'program', body: [] });
  });

  it('converts the four movement blocks', () => {
    load(chain(forward(), backward(), right(), left()));

    expect(workspaceToAst(workspace).body).toEqual([
      { type: 'move', direction: 'forward' },
      { type: 'move', direction: 'backward' },
      { type: 'move', direction: 'right' },
      { type: 'move', direction: 'left' },
    ]);
  });

  it('converts "forward" followed by "repeat 3 times: turn right"', () => {
    load(chain(forward(), repeat(3, right())));

    expect(workspaceToAst(workspace)).toEqual({
      type: 'program',
      body: [
        { type: 'move', direction: 'forward' },
        { type: 'repeat', times: 3, body: [{ type: 'move', direction: 'right' }] },
      ],
    });
  });

  it('converts nested repeats and empty repeat bodies', () => {
    load(repeat(2, repeat(4, forward(), left()), repeat(5)));

    expect(workspaceToAst(workspace).body).toEqual([
      {
        type: 'repeat',
        times: 2,
        body: [
          {
            type: 'repeat',
            times: 4,
            body: [
              { type: 'move', direction: 'forward' },
              { type: 'move', direction: 'left' },
            ],
          },
          { type: 'repeat', times: 5, body: [] },
        ],
      },
    ]);
  });

  it('reads separate stacks from top to bottom', () => {
    load({ ...left(), x: 0, y: 300 }, { ...forward(), x: 0, y: 10 });

    expect(workspaceToAst(workspace).body).toEqual([
      { type: 'move', direction: 'forward' },
      { type: 'move', direction: 'left' },
    ]);
  });

  it('ignores disabled blocks', () => {
    load(chain(forward(), right(), backward()));
    workspace.getBlocksByType(BlockType.TurnRight)[0].setDisabledReason(true, 'test');

    expect(workspaceToAst(workspace).body).toEqual([
      { type: 'move', direction: 'forward' },
      { type: 'move', direction: 'backward' },
    ]);
  });

  it('ignores block types it does not know', () => {
    load(chain(forward(), { type: 'test_unknown' }, left()));

    expect(workspaceToAst(workspace).body).toEqual([
      { type: 'move', direction: 'forward' },
      { type: 'move', direction: 'left' },
    ]);
  });

  it('converts an "if" block with its condition and body', () => {
    load(ifThen('obstacleAhead', right(), forward()));

    expect(workspaceToAst(workspace).body).toEqual([
      {
        type: 'if',
        condition: { type: 'sensor', sensor: 'obstacleAhead' },
        thenBody: [
          { type: 'move', direction: 'right' },
          { type: 'move', direction: 'forward' },
        ],
      },
    ]);
  });

  it.each(['obstacleAhead', 'obstacleRight', 'obstacleLeft'])('reads the "%s" condition', (sensor) => {
    load(ifThen(sensor));

    expect(workspaceToAst(workspace).body).toEqual([
      { type: 'if', condition: { type: 'sensor', sensor }, thenBody: [] },
    ]);
  });

  it('converts an "if / else" block with both branches', () => {
    load(ifElse('obstacleRight', [left()], [forward(), forward()]));

    expect(workspaceToAst(workspace).body).toEqual([
      {
        type: 'if',
        condition: { type: 'sensor', sensor: 'obstacleRight' },
        thenBody: [{ type: 'move', direction: 'left' }],
        elseBody: [
          { type: 'move', direction: 'forward' },
          { type: 'move', direction: 'forward' },
        ],
      },
    ]);
  });

  it('keeps an empty "else" branch, but a plain "if" has none', () => {
    load(chain(ifElse('obstacleAhead', [], []), ifThen('obstacleAhead')));

    const [withElse, withoutElse] = workspaceToAst(workspace).body;
    expect(withElse).toMatchObject({ type: 'if', thenBody: [], elseBody: [] });
    expect(withoutElse).not.toHaveProperty('elseBody');
  });

  it('converts conditions and repeats nested inside each other', () => {
    load(repeat(4, ifElse('obstacleAhead', [right()], [repeat(2, forward())])));

    expect(workspaceToAst(workspace).body).toEqual([
      {
        type: 'repeat',
        times: 4,
        body: [
          {
            type: 'if',
            condition: { type: 'sensor', sensor: 'obstacleAhead' },
            thenBody: [{ type: 'move', direction: 'right' }],
            elseBody: [{ type: 'repeat', times: 2, body: [{ type: 'move', direction: 'forward' }] }],
          },
        ],
      },
    ]);
  });

  it('keeps the repeat count inside the allowed range', () => {
    load(repeat(500, forward()));

    expect(workspaceToAst(workspace).body[0]).toMatchObject({ type: 'repeat', times: 99 });
  });
});
