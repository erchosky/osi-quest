import { installPWA } from './services/pwa.js';
import { installVersionCheck } from './app/version-check.js';
import { createApplication } from './app/application.js';
import { installKeyboardControls } from './app/accessibility.js';
import { installTestingHooks } from './app/testing-hooks.js';

const app = createApplication();
installKeyboardControls();
installVersionCheck(app);
installPWA(app);
if (document.modelContext?.registerTool)
  import('./app/webmcp.js').then((m) => m.installWebMCP(app)).catch(() => {});
if (typeof __TEST__ === 'undefined' || __TEST__) installTestingHooks(app);
if (typeof __DEV__ === 'undefined' || __DEV__)
  import('./app/development.js').then((m) => m.installDevelopmentPanel());
