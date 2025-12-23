import * as messageEventsSchema from './message-events.schema';
import * as memberLifecycleSchema from './member-lifecycle.schema';
import * as voiceSessionsSchema from './voice-sessions.schema';

export const schema = {
  ...messageEventsSchema,
  ...memberLifecycleSchema,
  ...voiceSessionsSchema,
};