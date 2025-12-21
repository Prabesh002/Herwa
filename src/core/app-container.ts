type ServiceIdentifier<T> = new (...args: any[]) => T;

export class AppContainer {
  private static instance: AppContainer;
  private readonly services: Map<ServiceIdentifier<any>, any> = new Map();

  private constructor() {}

  public static getInstance(): AppContainer {
    if (!AppContainer.instance) {
      AppContainer.instance = new AppContainer();
    }
    return AppContainer.instance;
  }

  public register<T>(
    identifier: ServiceIdentifier<T>,
    instance: T,
  ): void {
    if (this.services.has(identifier)) {
      throw new Error(
        `Service with identifier ${identifier.name} is already registered.`,
      );
    }
    this.services.set(identifier, instance);
  }

  public get<T>(identifier: ServiceIdentifier<T>): T {
    const instance = this.services.get(identifier) as T;
    if (!instance) {
      throw new Error(
        `Service with identifier ${identifier.name} is not registered.`,
      );
    }
    return instance;
  }
}