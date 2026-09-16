import 'virtual:uno.css';

import { createAppContext } from '@/shared';
import { platform } from '@/manage/env';
import { base, routes } from './router';

import './layout';

const context = await createAppContext({ name: 'shared', base, routes, platform });
context.app.mount('#app');
