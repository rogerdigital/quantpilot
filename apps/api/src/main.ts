import { createChildLogger } from './lib/logger.js';
import { seedDefaultAdmin } from './modules/auth/user-store.js';

seedDefaultAdmin();

const log = createChildLogger('main');

import { startGatewayServer } from './app/index.js';

startGatewayServer();
