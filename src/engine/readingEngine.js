import { AXIS_READINGS, TENSION_READINGS } from '../constants/readingText.js';
import { computeTraitRead } from './traitEngine.js';

export function composeFinalReading(state = {}) {
  const read = state.traitRead || computeTraitRead(state);
  const tally = state.classTally || {};
  const dominantClass = ['TYPICAL', 'REVELATORY', 'WRONG']
    .sort((a, b) => (tally[b] || 0) - (tally[a] || 0))[0];
  const evidence = (state.choiceEvidence || []).filter(item => item?.chosenLabel).slice(-3);
  const callbacks = evidence.map((item, index) => {
    const lead = index === 0 ? 'When asked' : index === 1 ? 'Later, when asked' : 'And at the threshold, when asked';
    return `${lead} “${item.questionText}”, you chose “${item.chosenLabel}”.`;
  });

  return {
    title: read.archetype?.name || 'The Unresolved Pattern',
    paragraphs: [
      AXIS_READINGS[read.primary] || 'You resisted becoming simple enough to name.',
      TENSION_READINGS[dominantClass],
      callbacks.join(' '),
      'This is how your group reaches consensus: not by finding one mind, but by deciding which doubt is permitted to speak for all of you.',
    ].filter(Boolean),
  };
}
