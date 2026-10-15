export type Direction = 'forward' | 'backward' | 'left' | 'right';

export interface Move {
  type: 'move';
  direction: Direction;
}

export interface Repeat {
  type: 'repeat';
  times: number;
  body: Statement[];
}

export type Sensor = 'obstacleAhead' | 'obstacleRight' | 'obstacleLeft';

export const SENSORS: readonly Sensor[] = ['obstacleAhead', 'obstacleRight', 'obstacleLeft'];

export const isSensor = (value: unknown): value is Sensor =>
  SENSORS.some((sensor) => sensor === value);

export interface SensorCondition {
  type: 'sensor';
  sensor: Sensor;
}

export type Condition = SensorCondition;

export interface If {
  type: 'if';
  condition: Condition;
  thenBody: Statement[];
  elseBody?: Statement[];
}

export type Statement = Move | Repeat | If;

export interface Program {
  type: 'program';
  body: Statement[];
}

export const emptyProgram = (): Program => ({ type: 'program', body: [] });

export const isEmptyProgram = (program: Program): boolean => program.body.length === 0;
