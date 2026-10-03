import { parseBackup } from './progress-schema.js';
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ candidate: parseBackup(data) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
