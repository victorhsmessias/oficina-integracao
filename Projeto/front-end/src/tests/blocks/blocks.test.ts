import * as Blockly from 'blockly/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BlockType, blockDefinitions, registerBlocks, toolbox } from '../../blocks';

interface ToolboxItem {
  kind: string;
  type?: string;
  name?: string;
  contents?: ToolboxItem[];
}

const toolboxItems = (toolbox as { contents: ToolboxItem[] }).contents;

describe('robot blocks', () => {
  let workspace: Blockly.Workspace | null = null;

  beforeAll(() => {
    registerBlocks();
  });

  afterEach(() => {
    workspace?.dispose();
    workspace = null;
  });

  it('registers every block used in the toolbox', () => {
    const toolboxTypes = toolboxItems.flatMap((category) =>
      (category.contents ?? []).map((item) => item.type ?? ''),
    );

    expect(toolboxTypes).toEqual(blockDefinitions.map((definition) => definition.type));
    toolboxTypes.forEach((type) => expect(Blockly.Blocks[type]).toBeDefined());
  });

  it('organizes the toolbox in Portuguese categories', () => {
    expect(toolboxItems.map((category) => category.name)).toEqual([
      'Movimento',
      'Repetição',
      'Condição',
    ]);
  });

  it('can be registered more than once', () => {
    expect(() => registerBlocks()).not.toThrow();
  });

  it('offers the three conditions in the "if / else" block', () => {
    workspace = new Blockly.Workspace();
    const block = workspace.newBlock(BlockType.IfElse);
    const field = block.getField('CONDITION') as Blockly.FieldDropdown;

    expect(field.getOptions().map(([, sensor]) => sensor)).toEqual([
      'obstacleAhead',
      'obstacleRight',
      'obstacleLeft',
    ]);
    expect(block.toString()).toContain('Se há obstáculo à frente então');
    expect(block.toString()).toContain('senão');
    expect(block.getInput('THEN')).not.toBeNull();
    expect(block.getInput('ELSE')).not.toBeNull();
  });
});
