import { IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { VoiceStateUpdateHandler } from './handlers/voice-state-update.handler';

export const VoiceEventHandlers: IEventHandlerConstructor[] = [
  VoiceStateUpdateHandler,
];