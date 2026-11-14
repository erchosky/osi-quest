import { physicalLesson } from './physical.js';
import { linkLesson } from './link.js';
import { networkLesson } from './network.js';
import { transportLesson } from './transport.js';
import { sessionLesson } from './session.js';
import { presentationLesson } from './presentation.js';
import { applicationLesson } from './application.js';

// Full lessons belong to the deferred study feature, not the lightweight layer cards.
export const layerLessons = {
  1: physicalLesson,
  2: linkLesson,
  3: networkLesson,
  4: transportLesson,
  5: sessionLesson,
  6: presentationLesson,
  7: applicationLesson,
};
