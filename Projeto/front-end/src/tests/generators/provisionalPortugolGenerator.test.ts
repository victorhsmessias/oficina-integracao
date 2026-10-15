import { describe, expect, it } from 'vitest';
import type { Program, Statement } from '../../ast';
import { codeGenerator } from '../../generators';
import {
  loopVariable,
  provisionalPortugolGenerator as generator,
} from '../../generators/provisionalPortugolGenerator';

const program = (...body: Statement[]): Program => ({ type: 'program', body });

describe('provisional Portugol generator', () => {
  it('is the generator used by the application', () => {
    expect(codeGenerator).toBe(generator);
    expect(generator.language).toBe('Portugol');
  });

  it('generates the program skeleton for an empty program', () => {
    expect(generator.generate(program())).toBe(
      [
        '// Código gerado automaticamente (gerador PROVISÓRIO)',
        'programa',
        '{',
        '\tfuncao inicio()',
        '\t{',
        '\t}',
        '}',
      ].join('\n'),
    );
  });

  it('generates "forward" followed by "repeat 3 times: turn right"', () => {
    const code = generator.generate(
      program(
        { type: 'move', direction: 'forward' },
        { type: 'repeat', times: 3, body: [{ type: 'move', direction: 'right' }] },
      ),
    );

    expect(code).toBe(
      [
        '// Código gerado automaticamente (gerador PROVISÓRIO)',
        'programa',
        '{',
        '\tfuncao inicio()',
        '\t{',
        '\t\tandarParaFrente()',
        '\t\tpara (inteiro i = 1; i <= 3; i++)',
        '\t\t{',
        '\t\t\tvirarDireita()',
        '\t\t}',
        '\t}',
        '}',
      ].join('\n'),
    );
  });

  it('maps every direction to a robot command', () => {
    const code = generator.generate(
      program(
        { type: 'move', direction: 'forward' },
        { type: 'move', direction: 'backward' },
        { type: 'move', direction: 'right' },
        { type: 'move', direction: 'left' },
      ),
    );

    expect(code).toContain(
      '\t\tandarParaFrente()\n\t\tandarParaTras()\n\t\tvirarDireita()\n\t\tvirarEsquerda()',
    );
  });

  it('uses a different loop variable for each nesting level', () => {
    const code = generator.generate(
      program({
        type: 'repeat',
        times: 2,
        body: [{ type: 'repeat', times: 4, body: [{ type: 'move', direction: 'left' }] }],
      }),
    );

    expect(code).toContain('\t\tpara (inteiro i = 1; i <= 2; i++)');
    expect(code).toContain('\t\t\tpara (inteiro j = 1; j <= 4; j++)');
    expect(code).toContain('\t\t\t\tvirarEsquerda()');
  });

  it('generates an "if / else"', () => {
    const code = generator.generate(
      program({
        type: 'if',
        condition: { type: 'sensor', sensor: 'obstacleAhead' },
        thenBody: [{ type: 'move', direction: 'right' }],
        elseBody: [{ type: 'move', direction: 'forward' }],
      }),
    );

    expect(code).toContain(
      [
        '\t\tse (obstaculoAFrente())',
        '\t\t{',
        '\t\t\tvirarDireita()',
        '\t\t}',
        '\t\tsenao',
        '\t\t{',
        '\t\t\tandarParaFrente()',
        '\t\t}',
      ].join('\n'),
    );
  });

  it('generates an empty "else" only when the block has one', () => {
    const withElse = generator.generate(
      program({
        type: 'if',
        condition: { type: 'sensor', sensor: 'obstacleLeft' },
        thenBody: [],
        elseBody: [],
      }),
    );
    const withoutElse = generator.generate(
      program({ type: 'if', condition: { type: 'sensor', sensor: 'obstacleLeft' }, thenBody: [] }),
    );

    expect(withElse).toContain('\t\t}\n\t\tsenao\n\t\t{\n\t\t}');
    expect(withoutElse).not.toContain('senao');
  });

  it.each([
    ['obstacleAhead', 'obstaculoAFrente()'],
    ['obstacleRight', 'obstaculoADireita()'],
    ['obstacleLeft', 'obstaculoAEsquerda()'],
  ] as const)('maps the "%s" condition to %s', (sensor, call) => {
    const code = generator.generate(
      program({ type: 'if', condition: { type: 'sensor', sensor }, thenBody: [] }),
    );

    expect(code).toContain(`se (${call})`);
  });

  it('indents conditions inside loops and keeps loop variables', () => {
    const code = generator.generate(
      program({
        type: 'repeat',
        times: 2,
        body: [
          {
            type: 'if',
            condition: { type: 'sensor', sensor: 'obstacleAhead' },
            thenBody: [],
            elseBody: [{ type: 'repeat', times: 3, body: [{ type: 'move', direction: 'left' }] }],
          },
        ],
      }),
    );

    expect(code).toContain('\t\t\tsenao');
    expect(code).toContain('\t\t\t\tpara (inteiro j = 1; j <= 3; j++)');
  });

  it('generates an "if" with a sensor condition', () => {
    const code = generator.generate(
      program({
        type: 'if',
        condition: { type: 'sensor', sensor: 'obstacleAhead' },
        thenBody: [{ type: 'move', direction: 'right' }],
      }),
    );

    expect(code).toContain('\t\tse (obstaculoAFrente())\n\t\t{\n\t\t\tvirarDireita()\n\t\t}');
  });

  it('keeps generating loop variable names for deep nesting', () => {
    expect(loopVariable(0)).toBe('i');
    expect(loopVariable(2)).toBe('k');
    expect(loopVariable(6)).toBe('i7');
  });
});
