import DIC from './dic';
import { CSS } from './init.service';

export interface SubtitleElement extends HTMLDivElement {
  youtubeExternalSubtitle: Subtitle;
}

export interface SubtitleFrame extends HTMLIFrameElement {
  youtubeExternalSubtitle: Subtitle;
}

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
}

export interface State {
  text: string;
  isFullscreenActive: boolean;
  controlsVisible: boolean;
}

interface Cache {
  [propName: number]: SubtitleEntry[];
}

export const getCacheName = (seconds: number): number => {
  return Math.floor(seconds / 10);
};

export const getCacheNames = (start: number, end: number): number[] => {
  const cacheNames = [];
  const endCacheName = getCacheName(end);

  for (let i = getCacheName(start); i <= endCacheName; i++) {
    cacheNames.push(i);
  }

  return cacheNames;
};

export const buildCache = (subtitles: SubtitleEntry[]): Cache => {
  const cache = {};

  for (const subtitle of subtitles) {
    for (const cacheName of getCacheNames(subtitle.start, subtitle.end)) {
      if (!cache[cacheName]) {
        cache[cacheName] = [];
      }

      cache[cacheName].push(subtitle);
    }
  }

  return cache;
};

export const getSubtitleFromCache = (seconds: number, builtCache: Cache): SubtitleEntry => {
  if (!builtCache) {
    return null;
  }

  const cache = builtCache[getCacheName(seconds)];

  if (!cache) {
    return null;
  }

  for (const subtitle of cache) {
    if (seconds >= subtitle.start && seconds <= subtitle.end) {
      return subtitle;
    }
  }

  return null;
};

export const addQueryStringParameterToUrl = (url: string, qsParameters: any): string => {
  const hashIndex = url.indexOf('#');
  let hash = '';

  if (hashIndex !== -1) {
    hash = url.substr(hashIndex);
    url = url.substr(0, hashIndex);
  }

  const qsIndex = url.indexOf('?');
  let qs = '';

  if (qsIndex !== -1) {
    qs = url.substr(qsIndex);
    url = url.substr(0, qsIndex);
  }

  for (const i in qsParameters) {
    if (!qsParameters.hasOwnProperty(i)) {
      continue;
    }

    qs += `${qs === '' ? '?' : '&'}${i}=${qsParameters[i]}`;
  }

  return `${url}${qs}${hash}`;
};

export const getIframeSrc = (src: string): string => {
  let newSrc = src;

  if (newSrc.indexOf('enablejsapi=1') === -1) {
    newSrc = addQueryStringParameterToUrl(newSrc, { enablejsapi: '1' });
  }

  if (newSrc.indexOf('html5=1') === -1) {
    newSrc = addQueryStringParameterToUrl(newSrc, { html5: '1' });
  }

  if (newSrc.indexOf('playsinline=1') === -1) {
    newSrc = addQueryStringParameterToUrl(newSrc, { playsinline: '1' });
  }

  if (newSrc.indexOf('fs=') === -1) {
    newSrc = addQueryStringParameterToUrl(newSrc, { fs: '0' });
  }

  return newSrc;
};

export const createSubtitleElement = (iframe: SubtitleFrame, subtitle: Subtitle): SubtitleElement => {
  const document = DIC.getDocument();

  const element = document.createElement('div') as SubtitleElement;

  element.youtubeExternalSubtitle = subtitle;

  iframe.parentNode.insertBefore(element, iframe.nextSibling);

  return element;
};

export const isStateChanged = (prevState: State, nextState: State): boolean => {
  for (const i in nextState) {
    if (!nextState.hasOwnProperty(i)) {
      continue;
    }

    if (prevState[i] !== nextState[i]) {
      return true;
    }
  }

  return false;
};

export const renderClassName = (isFullscreenActive: boolean): string => {
  const classes = [ CSS.CLASS ];

  if (isFullscreenActive !== null) {
    classes.push(isFullscreenActive ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
  }

  return classes.join(' ');
};

export const renderText = (text: string): string => {
  return `<span>${(text === null ? '' : text).replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>')}</span>`;
};

export const getFrameRect = (iframe: SubtitleFrame, controlsVisible: boolean): {
  x: number,
  y: number,
  width: number,
  height: number,
  bottomPadding: number
} => {
  const height = iframe.offsetHeight;

  return {
    x: iframe.offsetLeft - iframe.scrollLeft + iframe.clientLeft,
    y: iframe.offsetTop - iframe.scrollTop + iframe.clientTop,
    width: iframe.offsetWidth,
    height: height,
    bottomPadding: height < 200 && !controlsVisible ? 20 : 60
  };
};

class Subtitle {
  private cache: Cache = null;
  private timeChangeInterval: number = 0;
  private controlsHideTimeout: number = 0;
  private player: any = null;
  private videoId: string = null;
  private readonly element: SubtitleElement = null;
  private state: State = {
    text: null,
    isFullscreenActive: null,
    controlsVisible: true
  };

  constructor(iframe: SubtitleFrame, subtitles: SubtitleEntry[]) {
    if (iframe.youtubeExternalSubtitle) {
      throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
    }

    iframe.youtubeExternalSubtitle = this;

    const initService = DIC.getInitService();

    initService.grantGlobalStyles();

    const src = getIframeSrc(iframe.src);

    if (iframe.src !== src) {
      iframe.src = src;
    }

    if (subtitles) {
      this.load(subtitles);
    }

    this.element = createSubtitleElement(iframe, this);

    this.render();

    initService.grantIframeApi(() => {
      const YT = DIC.getYT();

      this.player = new YT.Player(iframe);

      this.player.addEventListener('onReady', this.onPlayerReady);
      this.player.addEventListener('onStateChange', this.onPlayerStateChange);
    });
  }

  public load(subtitles: SubtitleEntry[]): void {
    this.cache = buildCache(subtitles);
  }

  public setIsFullscreenActive(isFullscreenActive: boolean): void {
    this.setState({ isFullscreenActive });
  }

  public destroy(): void {
    this.stop();

    this.element.parentNode.removeChild(this.element);

    this.player.getIframe().youtubeExternalSubtitle = null;

    this.player.removeEventListener('onReady', this.onPlayerReady);
    this.player.removeEventListener('onStateChange', this.onPlayerStateChange);
  }

  public render(): void {
    this.element.className = renderClassName(this.state.isFullscreenActive);
    this.element.innerHTML = renderText(this.state.text);

    this.element.style.display = this.state.text === null ? '' : 'block';

    if (this.player) {
      const frame = getFrameRect(this.player.getIframe(), this.state.controlsVisible);

      this.element.style.visibility = 'hidden';
      this.element.style.top = `${frame.y}px`;
      this.element.style.left = `${frame.x}px`;
      this.element.style.maxWidth = `${frame.width - 20}px`;
      this.element.style.fontSize = `${frame.height / 260}em`;

      this.element.style.top = `${frame.y + frame.height - frame.bottomPadding - this.element.offsetHeight}px`;
      this.element.style.left = `${frame.x + (frame.width - this.element.offsetWidth) / 2}px`;
      this.element.style.visibility = '';
    }
  }

  private setState(state: Partial<State>): void {
    const prevState = this.state;
    const nextState: State = {
      ...prevState,
      ...state
    };

    if (!isStateChanged(prevState, nextState)) {
      return;
    }

    this.state = nextState;

    this.render();
  }

  private start(): void {
    this.stop();

    const window = DIC.getWindow();

    this.timeChangeInterval = window.setInterval(this.onTimeChange, 500);

    this.controlsHideTimeout = window.setTimeout(() => {
      this.setState({ controlsVisible: false });
    }, 3000);
  }

  private stop(): void {
    clearInterval(this.timeChangeInterval);
    clearTimeout(this.controlsHideTimeout);

    this.setState({ controlsVisible: true });
  }

  private getCurrentVideoId(): string {
    return this.player.getVideoData().video_id;
  }

  private onTimeChange = (): void => {
    const subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);

    this.setState({ text: subtitle ? subtitle.text : null });
  };

  private onPlayerReady = (): void => {
    this.videoId = this.getCurrentVideoId();
  };

  private onPlayerStateChange = (e: any): void => {
    if (this.videoId !== this.getCurrentVideoId()) {
      return;
    }

    const YT = DIC.getYT();

    if (e.data === YT.PlayerState.PLAYING) {
      this.start();
    } else if (e.data === YT.PlayerState.PAUSED) {
      this.stop();
    } else if (e.data === YT.PlayerState.ENDED) {
      this.stop();

      this.setState({ text: null });
    }
  };
}

export default Subtitle;
