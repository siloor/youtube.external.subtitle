import DIC from './dic';
import Subtitle, { SubtitleElement } from './subtitle';

export const CSS = {
  ID: 'youtube-external-subtitle-style',
  CLASS: 'youtube-external-subtitle',
  FULLSCREEN: 'fullscreen',
  FULLSCREEN_IGNORE: 'fullscreen-ignore'
};

export const iframeApiScriptAdded = (document: Document): boolean => {
  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;

    if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
      return true;
    }
  }

  return false;
};

export const addIframeApiScript = (document: Document): void => {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

export const grantIframeApiScript = (document: Document): void => {
  if (!iframeApiScriptAdded(document)) {
    addIframeApiScript(document);
  }
};

export const iframeApiLoaded = (window: Window): boolean => {
  return !!(window.YT && window.YT.Player);
};

export const waitFor = (isReady: Function, onComplete: Function): void => {
  if (isReady()) {
    onComplete();

    return;
  }

  const interval = setInterval(() => {
    if (isReady()) {
      clearInterval(interval);

      onComplete();
    }
  }, 100);
};

export const getFullscreenElement = (document: Document): Element => {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.webkitCurrentFullScreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
};

export const getSubtitles = (container: Element|Document): Subtitle[] => {
  const initService = DIC.getInitService();

  return initService.getSubtitles().filter(subtitle => subtitle.isInContainer(container));
};

export const getFullscreenSubtitle = (fullscreenElement: SubtitleElement): Subtitle => {
  if (!fullscreenElement) {
    return null;
  }

  if (fullscreenElement.youtubeExternalSubtitle) {
    return fullscreenElement.youtubeExternalSubtitle;
  }

  const elements = getSubtitles(fullscreenElement);

  if (elements.length > 0) {
    return elements[0];
  }

  return null;
};

export const fullscreenChangeHandler = (): void => {
  const document = DIC.getDocument();

  const fullscreenElement = getFullscreenElement(document) as SubtitleElement;
  const isFullscreen = !!fullscreenElement;

  const fullscreenSubtitle = getFullscreenSubtitle(fullscreenElement);

  const subtitles = getSubtitles(document);

  for (const subtitle of subtitles) {
    subtitle.setIsFullscreenActive(isFullscreen ? fullscreenSubtitle === subtitle : null);
  }
};

export const globalStylesAdded = (document: Document): boolean => {
  return !!document.getElementById(CSS.ID);
};

export const addGlobalStyles = (document: Document): void => {
  const style = document.createElement('style');
  style.id = CSS.ID;
  style.type = 'text/css';
  style.innerHTML = `
    .${CSS.CLASS} { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-weight: normal; font-size: 17px; text-align: center; }
    .${CSS.CLASS} span { background: #000; background: rgba(0, 0, 0, 0.9); padding: 1px 4px; display: inline-block; margin-bottom: 2px; }
    .${CSS.CLASS}.${CSS.FULLSCREEN_IGNORE} { display: none !important; }
    .${CSS.CLASS}.${CSS.FULLSCREEN} { z-index: 3000000000; }
  `;

  const head = document.getElementsByTagName('head')[0] || document.documentElement;
  head.insertBefore(style, head.firstChild);

  document.addEventListener('fullscreenchange', fullscreenChangeHandler);
  document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
  document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
  document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
};

class InitService {
  private subtitles: Subtitle[] = [];

  public getSubtitles(): Subtitle[] {
    return this.subtitles;
  }

  public addSubtitle(subtitle: Subtitle): void {
    this.subtitles.push(subtitle);
  }

  public removeSubtitle(subtitle: Subtitle): void {
    const index = this.subtitles.indexOf(subtitle);

    if (index !== -1) {
      this.subtitles.splice(index, 1);
    }
  }

  public grantIframeApi(cb: Function): void {
    if (DIC.getYT() !== null) {
      cb();

      return;
    }

    const window = DIC.getWindow();
    const document = DIC.getDocument();

    waitFor(
      () => {
        return iframeApiLoaded(window);
      },
      () => {
        DIC.setYT(window.YT);

        cb();
      }
    );

    grantIframeApiScript(document);
  }

  public grantGlobalStyles(): void {
    const document = DIC.getDocument();

    if (!globalStylesAdded(document)) {
      addGlobalStyles(document);
    }
  }
}

export const init = (window: Window) => {
  DIC.setWindow(window);
  DIC.setDocument(window.document);
  DIC.setInitService(new InitService());
};

export default InitService;
