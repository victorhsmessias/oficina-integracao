import * as Blockly from 'blockly/core';

export const BlockStyle = {
  Movement: 'movement_blocks',
  Turn: 'turn_blocks',
  Loop: 'loop_blocks',
  Condition: 'condition_blocks',
} as const;

export const CategoryStyle = {
  Movement: 'movement_category',
  Loop: 'loop_category',
  Condition: 'condition_category',
} as const;

const MOVEMENT_COLOUR = '#4C97FF';
const TURN_COLOUR = '#9966FF';
const LOOP_COLOUR = '#FFAB19';
const CONDITION_COLOUR = '#40BF4A';

export const kidsTheme = Blockly.Theme.defineTheme('ellp_kids', {
  name: 'ellp_kids',
  base: Blockly.Themes.Classic,
  blockStyles: {
    [BlockStyle.Movement]: {
      colourPrimary: MOVEMENT_COLOUR,
      colourSecondary: '#3373CC',
      colourTertiary: '#2E5FA8',
    },
    [BlockStyle.Turn]: {
      colourPrimary: TURN_COLOUR,
      colourSecondary: '#774DCB',
      colourTertiary: '#5E3BA6',
    },
    [BlockStyle.Loop]: {
      colourPrimary: LOOP_COLOUR,
      colourSecondary: '#CF8B17',
      colourTertiary: '#A86F0F',
    },
    [BlockStyle.Condition]: {
      colourPrimary: CONDITION_COLOUR,
      colourSecondary: '#389E3F',
      colourTertiary: '#2E8034',
    },
  },
  categoryStyles: {
    [CategoryStyle.Movement]: { colour: MOVEMENT_COLOUR },
    [CategoryStyle.Loop]: { colour: LOOP_COLOUR },
    [CategoryStyle.Condition]: { colour: CONDITION_COLOUR },
  },
  componentStyles: {
    workspaceBackgroundColour: '#F7FAFF',
    toolboxBackgroundColour: '#FFFFFF',
    toolboxForegroundColour: '#1F2933',
    flyoutBackgroundColour: '#EEF3FB',
    flyoutOpacity: 1,
    scrollbarColour: '#C5D0DE',
  },
  fontStyle: {
    family: '"Nunito", "Segoe UI", Arial, sans-serif',
    weight: 'bold',
    size: 14,
  },
  startHats: false,
});
