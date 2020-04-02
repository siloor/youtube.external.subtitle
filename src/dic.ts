declare global {
  interface Document {
    webkitFullscreenElement: Element;
    webkitCurrentFullScreenElement: Element;
    mozFullScreenElement: Element;
    msFullscreenElement: Element;
  }
}

class Container {
  private document: Document = null;

  constructor() {}

  public setDocument(document: Document): void {
    this.document = document;
  }

  public getDocument(): Document {
    return this.document;
  }
}

export default new Container();
