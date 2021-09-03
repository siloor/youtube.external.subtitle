(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.YoutubeExternalSubtitle = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var Container = /** @class */ (function () {
        function Container() {
            this.window = null;
            this.document = null;
            this.YT = null;
            this.initService = null;
        }
        Container.prototype.setWindow = function (window) {
            this.window = window;
        };
        Container.prototype.getWindow = function () {
            return this.window;
        };
        Container.prototype.setDocument = function (document) {
            this.document = document;
        };
        Container.prototype.getDocument = function () {
            return this.document;
        };
        Container.prototype.setYT = function (YT) {
            this.YT = YT;
        };
        Container.prototype.getYT = function () {
            return this.YT;
        };
        Container.prototype.setInitService = function (initService) {
            this.initService = initService;
        };
        Container.prototype.getInitService = function () {
            return this.initService;
        };
        return Container;
    }());
    var DIC = new Container();

    var CSS = {
        ID: 'youtube-external-subtitle-style',
        CLASS: 'youtube-external-subtitle',
        FULLSCREEN: 'fullscreen',
        FULLSCREEN_IGNORE: 'fullscreen-ignore'
    };
    var iframeApiScriptAdded = function (document) {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
                return true;
            }
        }
        return false;
    };
    var addIframeApiScript = function (document) {
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    };
    var grantIframeApiScript = function (document) {
        if (!iframeApiScriptAdded(document)) {
            addIframeApiScript(document);
        }
    };
    var iframeApiLoaded = function (window) {
        return !!(window.YT && window.YT.Player);
    };
    var waitFor = function (isReady, onComplete) {
        if (isReady()) {
            onComplete();
            return;
        }
        var interval = setInterval(function () {
            if (isReady()) {
                clearInterval(interval);
                onComplete();
            }
        }, 100);
    };
    var getFullscreenElement = function (document) {
        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.webkitCurrentFullScreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;
    };
    var getSubtitles = function (container) {
        var initService = DIC.getInitService();
        return initService.getSubtitles().filter(function (subtitle) { return subtitle.isInContainer(container); });
    };
    var getFullscreenSubtitle = function (fullscreenElement) {
        if (!fullscreenElement) {
            return null;
        }
        if (fullscreenElement.youtubeExternalSubtitle) {
            return fullscreenElement.youtubeExternalSubtitle;
        }
        var elements = getSubtitles(fullscreenElement);
        if (elements.length > 0) {
            return elements[0];
        }
        return null;
    };
    var fullscreenChangeHandler = function () {
        var document = DIC.getDocument();
        var fullscreenElement = getFullscreenElement(document);
        var isFullscreen = !!fullscreenElement;
        var fullscreenSubtitle = getFullscreenSubtitle(fullscreenElement);
        var subtitles = getSubtitles(document);
        for (var _i = 0, subtitles_1 = subtitles; _i < subtitles_1.length; _i++) {
            var subtitle = subtitles_1[_i];
            subtitle.setIsFullscreenActive(isFullscreen ? fullscreenSubtitle === subtitle : null);
        }
    };
    var globalStylesAdded = function (document) {
        return !!document.getElementById(CSS.ID);
    };
    var addGlobalStyles = function (document) {
        var style = document.createElement('style');
        style.id = CSS.ID;
        style.type = 'text/css';
        style.innerHTML = "\n    ." + CSS.CLASS + " { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-weight: normal; font-size: 17px; text-align: center; }\n    ." + CSS.CLASS + " span { background: #000; background: rgba(0, 0, 0, 0.9); padding: 1px 4px; display: inline-block; margin-bottom: 2px; }\n    ." + CSS.CLASS + "." + CSS.FULLSCREEN_IGNORE + " { display: none !important; }\n    ." + CSS.CLASS + "." + CSS.FULLSCREEN + " { z-index: 3000000000; }\n  ";
        var head = document.getElementsByTagName('head')[0] || document.documentElement;
        head.insertBefore(style, head.firstChild);
        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    };
    var InitService = /** @class */ (function () {
        function InitService() {
            this.subtitles = [];
        }
        InitService.prototype.getSubtitles = function () {
            return this.subtitles;
        };
        InitService.prototype.addSubtitle = function (subtitle) {
            this.subtitles.push(subtitle);
        };
        InitService.prototype.removeSubtitle = function (subtitle) {
            var index = this.subtitles.indexOf(subtitle);
            if (index !== -1) {
                this.subtitles.splice(index, 1);
            }
        };
        InitService.prototype.grantIframeApi = function (cb) {
            if (DIC.getYT() !== null) {
                cb();
                return;
            }
            var window = DIC.getWindow();
            var document = DIC.getDocument();
            waitFor(function () {
                return iframeApiLoaded(window);
            }, function () {
                DIC.setYT(window.YT);
                cb();
            });
            grantIframeApiScript(document);
        };
        InitService.prototype.grantGlobalStyles = function () {
            var document = DIC.getDocument();
            if (!globalStylesAdded(document)) {
                addGlobalStyles(document);
            }
        };
        return InitService;
    }());
    var init = function (window) {
        DIC.setWindow(window);
        DIC.setDocument(window.document);
        DIC.setInitService(new InitService());
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
        for (var _i = 0, _a = Object.keys(qsParameters); _i < _a.length; _i++) {
            var qsParameterName = _a[_i];
            qs += "" + (qs === '' ? '?' : '&') + qsParameterName + "=" + qsParameters[qsParameterName];
        }
        return "" + url + qs + hash;
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
    var createSubtitleElement = function (iframe, subtitle) {
        var document = DIC.getDocument();
        var element = document.createElement('div');
        element.youtubeExternalSubtitle = subtitle;
        iframe.parentNode.insertBefore(element, iframe.nextSibling);
        return element;
    };
    var isStateChanged = function (prevState, nextState) {
        for (var _i = 0, _a = Object.keys(nextState); _i < _a.length; _i++) {
            var propertyName = _a[_i];
            if (prevState[propertyName] !== nextState[propertyName]) {
                return true;
            }
        }
        return false;
    };
    var renderClassName = function (isFullscreenActive) {
        var classes = [CSS.CLASS];
        if (isFullscreenActive !== null) {
            classes.push(isFullscreenActive ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
        }
        return classes.join(' ');
    };
    var renderText = function (text) {
        return "<span>" + (text === null ? '' : text).replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>') + "</span>";
    };
    var getFrameRect = function (iframe, controlsVisible) {
        var height = iframe.offsetHeight;
        return {
            x: iframe.offsetLeft - iframe.scrollLeft + iframe.clientLeft,
            y: iframe.offsetTop - iframe.scrollTop + iframe.clientTop,
            width: iframe.offsetWidth,
            height: height,
            bottomPadding: height < 200 && !controlsVisible ? 20 : 60
        };
    };
    var renderSubtitle = function (element, player, isFullscreenActive, text, controlsVisible) {
        element.className = renderClassName(isFullscreenActive);
        element.innerHTML = renderText(text);
        element.style.display = text === null ? '' : 'block';
        if (player) {
            var frame = getFrameRect(player.getIframe(), controlsVisible);
            element.style.visibility = 'hidden';
            element.style.top = frame.y + "px";
            element.style.left = frame.x + "px";
            element.style.maxWidth = frame.width - 20 + "px";
            element.style.fontSize = frame.height / 260 + "em";
            element.style.top = frame.y + frame.height - frame.bottomPadding - element.offsetHeight + "px";
            element.style.left = frame.x + (frame.width - element.offsetWidth) / 2 + "px";
            element.style.visibility = '';
        }
    };
    var Subtitle = /** @class */ (function () {
        function Subtitle(iframe, subtitles, renderMethod) {
            var _this = this;
            if (subtitles === void 0) { subtitles = []; }
            if (renderMethod === void 0) { renderMethod = null; }
            this.cache = null;
            this.timeChangeInterval = 0;
            this.controlsHideTimeout = 0;
            this.player = null;
            this.videoId = null;
            this.element = null;
            this.renderMethod = null;
            this.state = {
                text: null,
                isFullscreenActive: null,
                controlsVisible: true
            };
            this.onTimeChange = function () {
                var subtitle = getSubtitleFromCache(_this.player.getCurrentTime(), _this.cache);
                _this.setState({ text: subtitle ? subtitle.text : null });
            };
            this.onControlsHide = function () {
                _this.setState({ controlsVisible: false });
            };
            this.onPlayerReady = function () {
                _this.videoId = _this.getCurrentVideoId();
            };
            this.onPlayerStateChange = function (e) {
                if (_this.videoId !== _this.getCurrentVideoId()) {
                    return;
                }
                var YT = DIC.getYT();
                if (e.data === YT.PlayerState.PLAYING) {
                    _this.start();
                }
                else if (e.data === YT.PlayerState.PAUSED) {
                    _this.stop();
                }
                else if (e.data === YT.PlayerState.ENDED) {
                    _this.stop();
                    _this.setState({ text: null });
                }
            };
            if (iframe.youtubeExternalSubtitle) {
                throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
            }
            iframe.youtubeExternalSubtitle = this;
            var src = getIframeSrc(iframe.src);
            if (iframe.src !== src) {
                iframe.src = src;
            }
            this.load(subtitles);
            this.element = createSubtitleElement(iframe, this);
            this.renderMethod = renderMethod === null ? renderSubtitle : renderMethod;
            var initService = DIC.getInitService();
            initService.grantGlobalStyles();
            initService.addSubtitle(this);
            this.render();
            initService.grantIframeApi(function () {
                var YT = DIC.getYT();
                _this.player = new YT.Player(iframe);
                _this.player.addEventListener('onReady', _this.onPlayerReady);
                _this.player.addEventListener('onStateChange', _this.onPlayerStateChange);
            });
        }
        Subtitle.prototype.load = function (subtitles) {
            this.cache = buildCache(subtitles);
        };
        Subtitle.prototype.setIsFullscreenActive = function (isFullscreenActive) {
            this.setState({ isFullscreenActive: isFullscreenActive });
        };
        Subtitle.prototype.destroy = function () {
            this.stop();
            this.element.parentNode.removeChild(this.element);
            this.player.getIframe().youtubeExternalSubtitle = null;
            this.player.removeEventListener('onReady', this.onPlayerReady);
            this.player.removeEventListener('onStateChange', this.onPlayerStateChange);
            var initService = DIC.getInitService();
            initService.removeSubtitle(this);
        };
        Subtitle.prototype.render = function () {
            this.renderMethod(this.element, this.player, this.state.isFullscreenActive, this.state.text, this.state.controlsVisible);
        };
        Subtitle.prototype.isInContainer = function (container) {
            return container.contains(this.element) || container === this.element;
        };
        Subtitle.prototype.getYTPlayer = function () {
            return this.player;
        };
        Subtitle.prototype.setState = function (state) {
            var prevState = this.state;
            var nextState = __assign(__assign({}, prevState), state);
            if (!isStateChanged(prevState, nextState)) {
                return;
            }
            this.state = nextState;
            this.render();
        };
        Subtitle.prototype.start = function () {
            this.stop();
            var window = DIC.getWindow();
            this.timeChangeInterval = window.setInterval(this.onTimeChange, 500);
            this.controlsHideTimeout = window.setTimeout(this.onControlsHide, 3000);
            this.onTimeChange();
        };
        Subtitle.prototype.stop = function () {
            var window = DIC.getWindow();
            window.clearInterval(this.timeChangeInterval);
            window.clearTimeout(this.controlsHideTimeout);
            this.setState({ controlsVisible: true });
        };
        Subtitle.prototype.getCurrentVideoId = function () {
            return this.player.getVideoData().video_id;
        };
        return Subtitle;
    }());

    init(window);
    var youtube_external_subtitle = { Subtitle: Subtitle };

    return youtube_external_subtitle;

})));
