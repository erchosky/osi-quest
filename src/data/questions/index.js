import { normalQuestions } from './normal.js';
import { difficultQuestions } from './difficult.js';
import { caseQuestions } from './cases.js';
import { hardFunctionQuestions } from './hard-functions.js';
import { hardScenarioQuestions } from './hard-scenarios.js';
import { hardProtocolQuestions } from './hard-protocols.js';
import { normalFunctionQuestions } from './normal-functions.js';
import { storyQuestions } from '../story.js';
import { misconceptionQuestions } from '../misconceptions.js';

export const questions = [
  ...normalQuestions,
  ...difficultQuestions,
  ...caseQuestions,
  ...hardFunctionQuestions,
  ...hardScenarioQuestions,
  ...hardProtocolQuestions,
  ...normalFunctionQuestions,
];
export const learningQuestions = [...questions, ...misconceptionQuestions, ...storyQuestions];
export const questionById = new Map(learningQuestions.map((question) => [question.id, question]));
