import { ClientEvents } from 'discord.js';

export interface IEventHandler<T extends keyof ClientEvents = keyof ClientEvents> {
  readonly eventName: T;
  execute(...args: ClientEvents[T]): Promise<void>;
}

export type IEventHandlerConstructor = new () => IEventHandler<any>;