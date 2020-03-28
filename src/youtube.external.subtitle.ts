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

declare global {
  interface Element {
    parentFrame: any;
  }
}

const YoutubeExternalSubtitle: any = {};
const root = window;

const proxy = (func, context) => {
  return (...args) => {
    return func.apply(context, args);
  };
};

const hasClass = (element, cls) => {
  return !!element.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

const addClass = (element, cls) => {
  if (hasClass(element, cls)) {
    return;
  }

  element.className += (element.className ? ' ' : '') + cls;
};

const removeClass = (element, cls) => {
  if (!hasClass(element, cls)) {
    return;
  }

  const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');

  element.className = element.className.replace(reg, ' ');
};

const getYouTubeIDFromUrl = (url) => {
  const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);

  return match && match[7].length === 11 ? match[7] : false;
};

const addQueryStringParameterToUrl = (url, qsParameters) => {
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

const getCacheName = (seconds) => {
  return Math.floor(seconds / 10);
};

const getCacheNames = (start, end) => {
  const cacheNames = [];
  const endCacheName = getCacheName(end);

  for (let i = getCacheName(start); i <= endCacheName; i++) {
    cacheNames.push(i);
  }

  return cacheNames;
};

const buildCache = (subtitles) => {
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

const getSubtitleFromCache = (seconds, builtCache) => {
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

const iframeApiScriptAdded = () => {
  const scripts = root.document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;

    if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
      return true;
    }
  }

  return false;
};

const addIframeApiScript = () => {
  const tag = root.document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = root.document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

const loadIframeApi = (cb) => {
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

const fullscreenChangeHandler = (e) => {
  const fullscreenElement = root.document.fullscreenElement ||
    root.document.webkitFullscreenElement ||
    root.document.webkitCurrentFullScreenElement ||
    root.document.mozFullScreenElement ||
    root.document.msFullscreenElement;

  const subtitles = root.document.getElementsByClassName('youtube-external-subtitle');

  if (fullscreenElement) {
    if (fullscreenElement.youtubeExternalSubtitle) {
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];

        if (subtitle === fullscreenElement.youtubeExternalSubtitle.element) {
          addClass(subtitle, 'fullscreen');

          setTimeout(() => {
            subtitle.parentFrame.youtubeExternalSubtitle.render();
          }, 0);
        }
        else {
          addClass(subtitle, 'fullscreen-ignore');
        }
      }
    }
  }
  else {
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];

      if (hasClass(subtitle, 'fullscreen')) {
        removeClass(subtitle, 'fullscreen');

        subtitle.parentFrame.youtubeExternalSubtitle.render();
      }
      else {
        removeClass(subtitle, 'fullscreen-ignore');
      }
    }
  }
};

const firstInit = () => {
  const style = root.document.createElement('style');
  style.id = 'youtube-external-subtitle-style';
  style.type = 'text/css';
  style.innerHTML = ".youtube-external-subtitle { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 17px; text-align: center; } .youtube-external-subtitle span { background: #000; padding: 1px 4px; display: inline-block; margin-bottom: 2px; } .youtube-external-subtitle.fullscreen-ignore { display: none !important; } .youtube-external-subtitle.fullscreen { z-index: 3000000000; }";

  const head = root.document.getElementsByTagName('head')[0] || root.document.documentElement;
  head.insertBefore(style, head.firstChild);

  root.document.addEventListener('fullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
  root.document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
};

const getIframeSrc = (src) => {
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

const Subtitle = YoutubeExternalSubtitle.Subtitle = function(iframe, subtitles) {
  this.subtitle = null;
  this.cache = null;
  this.timeChangeInterval = 0;
  this.player = null;
  this.videoId = null;
  this.element = null;

  if (iframe.youtubeExternalSubtitle) {
    throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
  }

  iframe.youtubeExternalSubtitle = this;

  if (!root.document.getElementById('youtube-external-subtitle-style')) {
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
    addClass(this.element, 'youtube-external-subtitle');

    this.element.parentFrame = iframe;

    iframe.parentNode.insertBefore(this.element, iframe.nextSibling);

    this.player.addEventListener('onStateChange', proxy(this.onStateChange, this));
  });
};

Subtitle.prototype.load = function(subtitles) {
  this.cache = buildCache(subtitles);
};

Subtitle.prototype.start = function() {
  this.stop();

  this.timeChangeInterval = setInterval(proxy(this.onTimeChange, this), 500);
};

Subtitle.prototype.stop = function() {
  clearInterval(this.timeChangeInterval);
};

Subtitle.prototype.destroy = function() {
  this.stop();

  this.element.parentNode.removeChild(this.element);

  this.player.getIframe().youtubeExternalSubtitle = null;
};

Subtitle.prototype.getCurrentVideoId = function() {
  const videoUrl = this.player.getVideoEmbedCode().match(/src="(.*?)"/)[1];

  return getYouTubeIDFromUrl(videoUrl);
};

Subtitle.prototype.setSubtitle = function(subtitle) {
  if (this.subtitle === subtitle) {
    return;
  }

  this.subtitle = subtitle;

  this.render();
};

Subtitle.prototype.onStateChange = function(e) {
  if (this.videoId !== this.getCurrentVideoId()) {
    return;
  }

  if (e.data === root.YT.PlayerState.PLAYING) {
    this.start();
  }
  else if (e.data === root.YT.PlayerState.PAUSED) {
    this.stop();
  }
  else if (e.data === root.YT.PlayerState.ENDED) {
    this.stop();

    this.setSubtitle(null);
  }
};

Subtitle.prototype.onTimeChange = function() {
  const subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);

  this.setSubtitle(subtitle);
};

Subtitle.prototype.render = function() {
  if (this.subtitle === null) {
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

  this.element.innerHTML = '<span>' + this.subtitle.text.replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>') + '</span>';
  this.element.style.display = 'block';
  this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
  this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
};

export default YoutubeExternalSubtitle;
