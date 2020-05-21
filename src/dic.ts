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
  private onIframeApiReady: Function = null;
  private YT: any = null;

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

  public setOnIframeApiReady(onIframeApiReady: Function): void {
    this.onIframeApiReady = onIframeApiReady;
  }

  public getOnIframeApiReady(): Function {
    return this.onIframeApiReady;
  }
}

export default new Container();
