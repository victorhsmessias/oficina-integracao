import type * as Blockly from 'blockly/core';
import { BlockType, REPEAT_DEFAULT_TIMES, REPEAT_TIMES_FIELD } from './blockTypes';
import { CategoryStyle } from './theme';

const block = (type: string): Blockly.utils.toolbox.BlockInfo => ({ kind: 'block', type });

export const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Movimento',
      categorystyle: CategoryStyle.Movement,
      contents: [
        block(BlockType.MoveForward),
        block(BlockType.MoveBackward),
        block(BlockType.TurnRight),
        block(BlockType.TurnLeft),
      ],
    },
    {
      kind: 'category',
      name: 'Repetição',
      categorystyle: CategoryStyle.Loop,
      contents: [
        {
          ...block(BlockType.Repeat),
          fields: { [REPEAT_TIMES_FIELD]: REPEAT_DEFAULT_TIMES },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Condição',
      categorystyle: CategoryStyle.Condition,
      contents: [block(BlockType.If), block(BlockType.IfElse)],
    },
  ],
};
