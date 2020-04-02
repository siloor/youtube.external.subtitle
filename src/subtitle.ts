declare global {
  interface Window {
    YT: any;
  }
}

declare global {
  interface Document {
    webkitFullscreenElement: Element;
    webkitCurrentFullScreenElement: Element;
    mozFullScreenElement: Element;
    msFullscreenElement: Element;
  }
}

interface YoutubeExternalSubtitleElement extends Element {
  youtubeExternalSubtitle: Subtitle;
}

interface YoutubeExternalSubtitleFrame extends HTMLIFrameElement {
  youtubeExternalSubtitle: Subtitle;
}

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
}

interface State {
  text: string;
  isFullscreenActive: boolean;
}

const root = window;

const CSS = {
  ID: 'youtube-external-subtitle-style',
  CLASS: 'youtube-external-subtitle',
  FULLSCREEN: 'fullscreen',
  FULLSCREEN_IGNORE: 'fullscreen-ignore'
};

const addQueryStringParameterToUrl = (url: string, qsParameters: any): string => {
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

  for (let i in qsParameters) {
    qs += `${qs === '' ? '?' : '&'}${i}=${qsParameters[i]}`;
  }

  return `${url}${qs}${hash}`;
};

export const getCacheName = (seconds: number): number => {
  return Math.floor(seconds / 10);
};

const getCacheNames = (start: number, end: number): number[] => {
  const cacheNames = [];
  const endCacheName = getCacheName(end);

  for (let i = getCacheName(start); i <= endCacheName; i++) {
    cacheNames.push(i);
  }

  return cacheNames;
};

const buildCache = (subtitles: SubtitleEntry[]): any => {
  const cache = {};

  for (let subtitle of subtitles) {
    for (let cacheName of getCacheNames(subtitle.start, subtitle.end)) {
      if (!cache[cacheName]) {
        cache[cacheName] = [];
      }

      cache[cacheName].push(subtitle);
    }
  }

  return cache;
};

const getSubtitleFromCache = (seconds: number, builtCache: any): SubtitleEntry => {
  if (!builtCache) {
    return null;
  }

  const cache = builtCache[getCacheName(seconds)];

  if (!cache) {
    return null;
  }

  for (let subtitle of cache) {
    if (seconds >= subtitle.start && seconds <= subtitle.end) {
      return subtitle;
    }
  }

  return null;
};

const iframeApiScriptAdded = (): boolean => {
  const scripts = root.document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;

    if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
      return true;
    }
  }

  return false;
};

const addIframeApiScript = (): void => {
  const tag = root.document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = root.document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

const loadIframeApi = (cb: Function): void => {
  const iframeApiLoaded = () => {
    return !!(root.YT && root.YT.Player);
  };

  if (iframeApiLoaded()) {
    cb();

    return;
  }

  const iframeApiInterval = setInterval(() => {
    if (iframeApiLoaded()) {
      clearInterval(iframeApiInterval);

      cb();
    }
  }, 100);

  if (!iframeApiScriptAdded()) {
    addIframeApiScript();
  }
};

const getFullscreenElement = (): Element => {
  return root.document.fullscreenElement ||
    root.document.webkitFullscreenElement ||
    root.document.webkitCurrentFullScreenElement ||
    root.document.mozFullScreenElement ||
    root.document.msFullscreenElement;
};

const getSubtitles = (container: Element|Document): Subtitle[] => {
  const subtitleElements = container.getElementsByClassName(CSS.CLASS) as HTMLCollectionOf<YoutubeExternalSubtitleElement>;

  const subtitles = [];

  for (let i = 0; i < subtitleElements.length; i++) {
    subtitles.push(subtitleElements[i].youtubeExternalSubtitle);
  }

  return subtitles;
};

const getFullscreenSubtitle = (): {
  subtitle: Subtitle,
  isFullscreen: boolean
} => {
  const fullscreenElement = getFullscreenElement() as YoutubeExternalSubtitleElement;

  let subtitle = null;

  if (fullscreenElement) {
    if (fullscreenElement.youtubeExternalSubtitle) {
      subtitle = fullscreenElement.youtubeExternalSubtitle;
    } else {
      const elements = getSubtitles(fullscreenElement);

      if (elements.length > 0) {
        subtitle = elements[0];
      }
    }
  }

  return {
    subtitle: subtitle,
    isFullscreen: !!fullscreenElement
  };
};

const fullscreenChangeHandler = (): void => {
  const { subtitle: fullscreenSubtitle, isFullscreen } = getFullscreenSubtitle();

  const subtitles = getSubtitles(root.document);

  for (let subtitle of subtitles) {
    const isFullscreenActive = isFullscreen ? fullscreenSubtitle === subtitle : null;

    if (isFullscreen) {
      setTimeout(() => {
        subtitle.setIsFullscreenActive(isFullscreenActive);
      }, 0);
    } else {
      subtitle.setIsFullscreenActive(isFullscreenActive);
    }
  }
};

const firstInit = (): void => {
  const style = root.document.createElement('style');
  style.id = CSS.ID;
  style.type = 'text/css';
  style.innerHTML = `
    .${CSS.CLASS} { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 17px; text-align: center; }
    .${CSS.CLASS} span { background: #000; padding: 1px 4px; display: inline-block; margin-bottom: 2px; }
    .${CSS.CLASS}.${CSS.FULLSCREEN_IGNORE} { display: none !important; }
    .${CSS.CLASS}.${CSS.FULLSCREEN} { z-index: 3000000000; }
  `;

  const head = root.document.getElementsByTagName('head')[0] || root.document.documentElement;
  head.insertBefore(style, head.firstChild);

  root.document.addEventListener('fullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
};

const getIframeSrc = (src: string): string => {
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

const isStateChanged = (prevState: State, nextState: State): boolean => {
  for (let i in nextState) {
    if (prevState[i] !== nextState[i]) {
      return true;
    }
  }

  return false;
};

class Subtitle {
  private cache: any = null;
  private timeChangeInterval: number = 0;
  private player: any = null;
  private videoId: string = null;
  private readonly element: any = null;
  private state: State = {
    text: null,
    isFullscreenActive: null
  };

  constructor(iframe: YoutubeExternalSubtitleFrame, subtitles: SubtitleEntry[]) {
    if (iframe.youtubeExternalSubtitle) {
      throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
    }

    iframe.youtubeExternalSubtitle = this;

    if (!root.document.getElementById(CSS.ID)) {
      firstInit();
    }

    const src = getIframeSrc(iframe.src);

    if (iframe.src !== src) {
      iframe.src = src;
    }

    if (subtitles) {
      this.load(subtitles);
    }

    this.element = root.document.createElement('div');

    this.element.youtubeExternalSubtitle = this;

    iframe.parentNode.insertBefore(this.element, iframe.nextSibling);

    this.render();

    loadIframeApi(() => {
      this.player = new root.YT.Player(iframe);

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
    const classes = [ CSS.CLASS ];

    if (this.state.isFullscreenActive !== null) {
      classes.push(this.state.isFullscreenActive ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
    }

    this.element.className = classes.join(' ');

    const text = this.state.text === null ? '' : this.state.text;

    this.element.innerHTML = `<span>${text.replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>')}</span>`;

    this.element.style.display = this.state.text === null ? '' : 'block';

    if (this.player) {
      const iframe = this.player.getIframe();

      const frame = {
        x: iframe.offsetLeft - iframe.scrollLeft + iframe.clientLeft,
        y: iframe.offsetTop - iframe.scrollTop + iframe.clientTop,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight
      };

      this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
      this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
    }
  }

  private setState(state: any): void {
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

    this.timeChangeInterval = setInterval(() => this.onTimeChange(), 500);
  }

  private stop(): void {
    clearInterval(this.timeChangeInterval);
  }

  private getCurrentVideoId(): string {
    return this.player.getVideoData().video_id;
  }

  private onTimeChange(): void {
    const subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);

    this.setState({ text: subtitle ? subtitle.text : null });
  }

  private onPlayerReady = (): void => {
    this.videoId = this.getCurrentVideoId();
  };

  private onPlayerStateChange = (e: any): void => {
    if (this.videoId !== this.getCurrentVideoId()) {
      return;
    }

    if (e.data === root.YT.PlayerState.PLAYING) {
      this.start();
    } else if (e.data === root.YT.PlayerState.PAUSED) {
      this.stop();
    } else if (e.data === root.YT.PlayerState.ENDED) {
      this.stop();

      this.setState({ text: null });
    }
  };
}

export default Subtitle;
