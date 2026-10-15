import type { Direction, Sensor } from '../ast/types';

export const BlockType = {
  MoveForward: 'robot_move_forward',
  MoveBackward: 'robot_move_backward',
  TurnRight: 'robot_turn_right',
  TurnLeft: 'robot_turn_left',
  Repeat: 'robot_repeat',
  If: 'robot_if',
  IfElse: 'robot_if_else',
} as const;

export type BlockTypeName = (typeof BlockType)[keyof typeof BlockType];

export const MOVE_BLOCK_DIRECTIONS: Readonly<Partial<Record<string, Direction>>> = {
  [BlockType.MoveForward]: 'forward',
  [BlockType.MoveBackward]: 'backward',
  [BlockType.TurnRight]: 'right',
  [BlockType.TurnLeft]: 'left',
};

export const REPEAT_TIMES_FIELD = 'TIMES';
export const REPEAT_BODY_INPUT = 'DO';

export const REPEAT_MIN_TIMES = 1;
export const REPEAT_MAX_TIMES = 99;
export const REPEAT_DEFAULT_TIMES = 3;

export const IF_CONDITION_FIELD = 'CONDITION';
export const IF_THEN_INPUT = 'THEN';
export const IF_ELSE_INPUT = 'ELSE';

export const CONDITION_OPTIONS: ReadonlyArray<readonly [label: string, sensor: Sensor]> = [
  ['há obstáculo à frente', 'obstacleAhead'],
  ['há obstáculo à direita', 'obstacleRight'],
  ['há obstáculo à esquerda', 'obstacleLeft'],
];
