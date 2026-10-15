import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import * as PtBr from 'blockly/msg/pt-br';
import { workspaceToAst, type Program } from '../ast';
import { kidsTheme, registerBlocks, toolbox } from '../blocks';

interface BlocklyEditorProps {
  onProgramChange(program: Program): void;
}

Blockly.setLocale(PtBr as unknown as Record<string, string>);
registerBlocks();

export function BlocklyEditor({ onProgramChange }: BlocklyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onProgramChangeRef = useRef(onProgramChange);

  useEffect(() => {
    onProgramChangeRef.current = onProgramChange;
  }, [onProgramChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const workspace = Blockly.inject(container, {
      toolbox,
      theme: kidsTheme,
      renderer: 'zelos',
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: 0.9, maxScale: 2, minScale: 0.5 },
      grid: { spacing: 24, length: 2, colour: '#DCE4F0', snap: true },
    });

    const emitProgram = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent) return;
      onProgramChangeRef.current(workspaceToAst(workspace));
    };
    workspace.addChangeListener(emitProgram);

    const resizeObserver = new ResizeObserver(() => Blockly.svgResize(workspace));
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      workspace.removeChangeListener(emitProgram);
      workspace.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="blockly-editor"
      aria-label="Área de montagem dos blocos"
      role="region"
    />
  );
}
