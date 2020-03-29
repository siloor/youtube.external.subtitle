declare global {
  interface Window {
    YT: any;
  }
}

declare global {
  interface Document {
    webkitFullscreenElement: any;
    webkitCurrentFullScreenElement: any;
    mozFullScreenElement: any;
    msFullscreenElement: any;
  }
}

interface YoutubeExternalSubtitleElement extends Element {
  youtubeExternalSubtitle: any;
}

interface YoutubeExternalSubtitleFrame extends HTMLIFrameElement {
  youtubeExternalSubtitle: any;
}

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
}

interface State {
  text: string;
  classes: string[];
}

const root = window;

const CSS = {
  ID: 'youtube-external-subtitle-style',
  CLASS: 'youtube-external-subtitle',
  FULLSCREEN: 'fullscreen',
  FULLSCREEN_IGNORE: 'fullscreen-ignore'
};

const proxy = (func, context) => {
  return (...args) => {
    return func.apply(context, args);
  };
};

const getYouTubeIDFromUrl = (url: string): string => {
  const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);

  return match && match[7].length === 11 ? match[7] : null;
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
    qs += (qs === '' ? '?' : '&') + i + '=' + qsParameters[i];
  }

  return `${url}${qs}${hash}`;
};

const getCacheName = (seconds: number): number => {
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

const getFullscreenSubtitleElement = (): any => {
  const fullscreenElement = root.document.fullscreenElement ||
    root.document.webkitFullscreenElement ||
    root.document.webkitCurrentFullScreenElement ||
    root.document.mozFullScreenElement ||
    root.document.msFullscreenElement;

  let element = null;

  if (fullscreenElement) {
    if (fullscreenElement.youtubeExternalSubtitle) {
      element = fullscreenElement.youtubeExternalSubtitle.element;
    } else {
      const elements = fullscreenElement.getElementsByClassName(CSS.CLASS);

      if (elements.length > 0) {
        element = elements[0];
      }
    }
  }

  return {
    element: element,
    isFullscreen: !!fullscreenElement
  };
};

const fullscreenChangeHandler = (): void => {
  const { element: fullscreenSubtitleElement, isFullscreen } = getFullscreenSubtitleElement();

  const subtitles = root.document.getElementsByClassName(CSS.CLASS) as HTMLCollectionOf<YoutubeExternalSubtitleElement>;

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i].youtubeExternalSubtitle;

    if (isFullscreen) {
      setTimeout(() => {
        subtitle.addClass(fullscreenSubtitleElement === subtitle.element ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
      }, 0);
    } else {
      subtitle.removeClass(subtitle.hasClass(CSS.FULLSCREEN) ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
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
  private element: any = null;
  private state: State = {
    text: null,
    classes: []
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

    loadIframeApi(() => {
      this.player = new root.YT.Player(iframe);
      this.videoId = this.getCurrentVideoId();

      this.element = root.document.createElement('div');

      this.element.youtubeExternalSubtitle = this;

      iframe.parentNode.insertBefore(this.element, iframe.nextSibling);

      this.render();

      this.player.addEventListener('onStateChange', proxy(this.onStateChange, this));
    });
  }

  public load(subtitles: SubtitleEntry[]): void {
    this.cache = buildCache(subtitles);
  }

  public hasClass(cls: string): boolean {
    return this.state.classes.indexOf(cls) !== -1;
  }

  public addClass(cls: string): void {
    if (this.hasClass(cls)) {
      return;
    }

    this.setState({
      classes: [
        ...this.state.classes,
        cls
      ]
    });
  }

  public removeClass(cls: string): void {
    if (!this.hasClass(cls)) {
      return;
    }

    const classes = [ ...this.state.classes ];

    const index = classes.indexOf(cls);

    if (index > -1) {
      classes.splice(index, 1);
    }

    this.setState({ classes });
  }

  public destroy(): void {
    this.stop();

    this.element.parentNode.removeChild(this.element);

    this.player.getIframe().youtubeExternalSubtitle = null;
  }

  public render(): void {
    if (this.state.text === null) {
      this.element.style.display = '';

      return;
    }

    const iframe = this.player.getIframe();

    const frame = {
      x: iframe.offsetLeft - iframe.scrollLeft + iframe.clientLeft,
      y: iframe.offsetTop - iframe.scrollTop + iframe.clientTop,
      width: iframe.offsetWidth,
      height: iframe.offsetHeight
    };

    this.element.innerHTML = `<span>${this.state.text.replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>')}</span>`;
    this.element.className = `${CSS.CLASS} ${this.state.classes.join(' ')}`;
    this.element.style.display = 'block';
    this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
    this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
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

    this.timeChangeInterval = setInterval(proxy(this.onTimeChange, this), 500);
  }

  private stop(): void {
    clearInterval(this.timeChangeInterval);
  }

  private getCurrentVideoId(): string {
    const videoUrl = this.player.getVideoEmbedCode().match(/src="(.*?)"/)[1];

    return getYouTubeIDFromUrl(videoUrl);
  }

  private onStateChange(e: any): void {
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
  }

  private onTimeChange(): void {
    const subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);

    this.setState({ text: subtitle ? subtitle.text : null });
  }
}

export default { Subtitle };
