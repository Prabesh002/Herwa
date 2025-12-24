import { Events, VoiceState } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { VoiceSessionManager } from '@/discord/voice/voice-session-manager.service';

export class VoiceStateUpdateHandler implements IEventHandler<Events.VoiceStateUpdate> {
  public readonly eventName = Events.VoiceStateUpdate;
  private readonly sessionManager: VoiceSessionManager;

  constructor() {
    this.sessionManager = AppContainer.getInstance().get(VoiceSessionManager);
  }

  public async execute(oldState: VoiceState, newState: VoiceState): Promise<void> {
    this.sessionManager.handleStateUpdate(oldState, newState);
  }
}