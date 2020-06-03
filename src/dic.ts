import InitService from './init.service';

declare global {
  interface Document {
    webkitFullscreenElement: Element;
    webkitCurrentFullScreenElement: Element;
    mozFullScreenElement: Element;
    msFullscreenElement: Element;
  }
}

declare global {
  interface Window {
    YT: Youtube;
  }
}

export interface Youtube {
  Player: any;
  PlayerState: any;
}

export class Container {
  private window: Window = null;
  private document: Document = null;
  private YT: any = null;
  private initService: InitService = null;

  constructor() {}

  public setWindow(window: Window): void {
    this.window = window;
  }

  public getWindow(): Window {
    return this.window;
  }

  public setDocument(document: Document): void {
    this.document = document;
  }

  public getDocument(): Document {
    return this.document;
  }

  public setYT(YT: Youtube): void {
    this.YT = YT;
  }

  public getYT(): Youtube {
    return this.YT;
  }

  public setInitService(initService: InitService): void {
    this.initService = initService;
  }

  public getInitService(): InitService {
    return this.initService;
  }
}

export default new Container();
