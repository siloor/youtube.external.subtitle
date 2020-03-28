(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.YoutubeExternalSubtitle = factory());
}(this, (function () { 'use strict';

    var YoutubeExternalSubtitle = {};
    var root = window;
    var proxy = function (func, context) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return func.apply(context, args);
        };
    };
    var hasClass = function (element, cls) {
        return !!element.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    };
    var addClass = function (element, cls) {
        if (hasClass(element, cls)) {
            return;
        }
        element.className += (element.className ? ' ' : '') + cls;
    };
    var removeClass = function (element, cls) {
        if (!hasClass(element, cls)) {
            return;
        }
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        element.className = element.className.replace(reg, ' ');
    };
    var getYouTubeIDFromUrl = function (url) {
        var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
        return match && match[7].length === 11 ? match[7] : false;
    };
    var addQueryStringParameterToUrl = function (url, qsParameters) {
        var hashIndex = url.indexOf('#');
        var hash = '';
        if (hashIndex !== -1) {
            hash = url.substr(hashIndex);
            url = url.substr(0, hashIndex);
        }
        var qsIndex = url.indexOf('?');
        var qs = '';
        if (qsIndex !== -1) {
            qs = url.substr(qsIndex);
            url = url.substr(0, qsIndex);
        }
        for (var i in qsParameters) {
            qs += (qs === '' ? '?' : '&') + i + '=' + qsParameters[i];
        }
        return "" + url + qs + hash;
    };
    var getCacheName = function (seconds) {
        return Math.floor(seconds / 10);
    };
    var getCacheNames = function (start, end) {
        var cacheNames = [];
        var endCacheName = getCacheName(end);
        for (var i = getCacheName(start); i <= endCacheName; i++) {
            cacheNames.push(i);
        }
        return cacheNames;
    };
    var buildCache = function (subtitles) {
        var cache = {};
        for (var _i = 0, subtitles_1 = subtitles; _i < subtitles_1.length; _i++) {
            var subtitle = subtitles_1[_i];
            for (var _a = 0, _b = getCacheNames(subtitle.start, subtitle.end); _a < _b.length; _a++) {
                var cacheName = _b[_a];
                if (!cache[cacheName]) {
                    cache[cacheName] = [];
                }
                cache[cacheName].push(subtitle);
            }
        }
        return cache;
    };
    var getSubtitleFromCache = function (seconds, builtCache) {
        if (!builtCache) {
            return null;
        }
        var cache = builtCache[getCacheName(seconds)];
        if (!cache) {
            return null;
        }
        for (var _i = 0, cache_1 = cache; _i < cache_1.length; _i++) {
            var subtitle = cache_1[_i];
            if (seconds >= subtitle.start && seconds <= subtitle.end) {
                return subtitle;
            }
        }
        return null;
    };
    var iframeApiScriptAdded = function () {
        var scripts = root.document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
                return true;
            }
        }
        return false;
    };
    var addIframeApiScript = function () {
        var tag = root.document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = root.document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    };
    var loadIframeApi = function (cb) {
        var iframeApiLoaded = function () {
            return !!(root.YT && root.YT.Player);
        };
        if (iframeApiLoaded()) {
            cb();
            return;
        }
        var iframeApiInterval = setInterval(function () {
            if (iframeApiLoaded()) {
                clearInterval(iframeApiInterval);
                cb();
            }
        }, 100);
        if (!iframeApiScriptAdded()) {
            addIframeApiScript();
        }
    };
    var fullscreenChangeHandler = function (e) {
        var fullscreenElement = root.document.fullscreenElement ||
            root.document.webkitFullscreenElement ||
            root.document.webkitCurrentFullScreenElement ||
            root.document.mozFullScreenElement ||
            root.document.msFullscreenElement;
        var subtitles = root.document.getElementsByClassName('youtube-external-subtitle');
        if (fullscreenElement) {
            if (fullscreenElement.youtubeExternalSubtitle) {
                for (var i = 0; i < subtitles.length; i++) {
                    if (subtitles[i] === fullscreenElement.youtubeExternalSubtitle.element) {
                        addClass(subtitles[i], 'fullscreen');
                        setTimeout(function () {
                            fullscreenElement.youtubeExternalSubtitle.render();
                        }, 0);
                    }
                    else {
                        addClass(subtitles[i], 'fullscreen-ignore');
                    }
                }
            }
        }
        else {
            for (var i = 0; i < subtitles.length; i++) {
                if (hasClass(subtitles[i], 'fullscreen')) {
                    removeClass(subtitles[i], 'fullscreen');
                    subtitles[i].parentFrame.youtubeExternalSubtitle.render();
                }
                else {
                    removeClass(subtitles[i], 'fullscreen-ignore');
                }
            }
        }
    };
    var firstInit = function () {
        var style = root.document.createElement('style');
        style.id = 'youtube-external-subtitle-style';
        style.type = 'text/css';
        style.innerHTML = ".youtube-external-subtitle { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 17px; text-align: center; } .youtube-external-subtitle span { background: #000; padding: 1px 4px; display: inline-block; margin-bottom: 2px; } .youtube-external-subtitle.fullscreen-ignore { display: none !important; } .youtube-external-subtitle.fullscreen { z-index: 3000000000; }";
        var head = root.document.getElementsByTagName('head')[0] || root.document.documentElement;
        head.insertBefore(style, head.firstChild);
        root.document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        root.document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        root.document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        root.document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    };
    var getIframeSrc = function (src) {
        var newSrc = src;
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
    var Subtitle = YoutubeExternalSubtitle.Subtitle = function (iframe, subtitles) {
        var _this = this;
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
        var src = getIframeSrc(iframe.src);
        if (iframe.src !== src) {
            iframe.src = src;
        }
        if (subtitles) {
            this.load(subtitles);
        }
        loadIframeApi(function () {
            _this.player = new root.YT.Player(iframe);
            _this.videoId = _this.getCurrentVideoId();
            _this.element = root.document.createElement('div');
            addClass(_this.element, 'youtube-external-subtitle');
            _this.element.parentFrame = iframe;
            iframe.parentNode.insertBefore(_this.element, iframe.nextSibling);
            _this.player.addEventListener('onStateChange', proxy(_this.onStateChange, _this));
        });
    };
    Subtitle.prototype.load = function (subtitles) {
        this.cache = buildCache(subtitles);
    };
    Subtitle.prototype.start = function () {
        this.stop();
        this.timeChangeInterval = setInterval(proxy(this.onTimeChange, this), 500);
    };
    Subtitle.prototype.stop = function () {
        clearInterval(this.timeChangeInterval);
    };
    Subtitle.prototype.destroy = function () {
        this.stop();
        this.element.parentNode.removeChild(this.element);
        this.player.getIframe().youtubeExternalSubtitle = null;
    };
    Subtitle.prototype.getCurrentVideoId = function () {
        var videoUrl = this.player.getVideoEmbedCode().match(/src="(.*?)"/)[1];
        return getYouTubeIDFromUrl(videoUrl);
    };
    Subtitle.prototype.onStateChange = function (e) {
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
            this.subtitle = null;
            this.render();
        }
    };
    Subtitle.prototype.onTimeChange = function () {
        var subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);
        if (this.subtitle === subtitle) {
            return;
        }
        this.subtitle = subtitle;
        this.render();
    };
    Subtitle.prototype.render = function () {
        if (this.subtitle === null) {
            this.element.style.display = '';
            return;
        }
        var iframe = this.player.getIframe();
        var frame = {
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

    return YoutubeExternalSubtitle;

})));
