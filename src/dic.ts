declare global {
  interface Document {
    webkitFullscreenElement: Element;
    webkitCurrentFullScreenElement: Element;
    mozFullScreenElement: Element;
    msFullscreenElement: Element;
  }
}

export interface Youtube {
  Player: any;
  PlayerState: any;
}

export class Container {
  private document: Document = null;
  private onIframeApiReady: Function = null;
  private YT: any = null;

  constructor() {}

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
