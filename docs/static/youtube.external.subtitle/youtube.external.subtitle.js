(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.YoutubeExternalSubtitle = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
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

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var root = window;
    var CSS = {
        ID: 'youtube-external-subtitle-style',
        CLASS: 'youtube-external-subtitle',
        FULLSCREEN: 'fullscreen',
        FULLSCREEN_IGNORE: 'fullscreen-ignore'
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
            qs += "" + (qs === '' ? '?' : '&') + i + "=" + qsParameters[i];
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
    var getFullscreenElement = function () {
        return root.document.fullscreenElement ||
            root.document.webkitFullscreenElement ||
            root.document.webkitCurrentFullScreenElement ||
            root.document.mozFullScreenElement ||
            root.document.msFullscreenElement;
    };
    var getSubtitles = function (container) {
        var subtitleElements = container.getElementsByClassName(CSS.CLASS);
        var subtitles = [];
        for (var i = 0; i < subtitleElements.length; i++) {
            subtitles.push(subtitleElements[i].youtubeExternalSubtitle);
        }
        return subtitles;
    };
    var getFullscreenSubtitle = function () {
        var fullscreenElement = getFullscreenElement();
        var subtitle = null;
        if (fullscreenElement) {
            if (fullscreenElement.youtubeExternalSubtitle) {
                subtitle = fullscreenElement.youtubeExternalSubtitle;
            }
            else {
                var elements = getSubtitles(fullscreenElement);
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
    var fullscreenChangeHandler = function () {
        var _a = getFullscreenSubtitle(), fullscreenSubtitle = _a.subtitle, isFullscreen = _a.isFullscreen;
        var subtitles = getSubtitles(root.document);
        var _loop_1 = function (subtitle) {
            if (isFullscreen) {
                setTimeout(function () {
                    subtitle.addClass(fullscreenSubtitle === subtitle ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
                }, 0);
            }
            else {
                subtitle.removeClass(subtitle.hasClass(CSS.FULLSCREEN) ? CSS.FULLSCREEN : CSS.FULLSCREEN_IGNORE);
            }
        };
        for (var _i = 0, subtitles_2 = subtitles; _i < subtitles_2.length; _i++) {
            var subtitle = subtitles_2[_i];
            _loop_1(subtitle);
        }
    };
    var firstInit = function () {
        var style = root.document.createElement('style');
        style.id = CSS.ID;
        style.type = 'text/css';
        style.innerHTML = "\n    ." + CSS.CLASS + " { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 17px; text-align: center; }\n    ." + CSS.CLASS + " span { background: #000; padding: 1px 4px; display: inline-block; margin-bottom: 2px; }\n    ." + CSS.CLASS + "." + CSS.FULLSCREEN_IGNORE + " { display: none !important; }\n    ." + CSS.CLASS + "." + CSS.FULLSCREEN + " { z-index: 3000000000; }\n  ";
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
    var isStateChanged = function (prevState, nextState) {
        for (var i in nextState) {
            if (prevState[i] !== nextState[i]) {
                return true;
            }
        }
        return false;
    };
    var Subtitle = /** @class */ (function () {
        function Subtitle(iframe, subtitles) {
            var _this = this;
            this.cache = null;
            this.timeChangeInterval = 0;
            this.player = null;
            this.videoId = null;
            this.element = null;
            this.state = {
                text: null,
                classes: []
            };
            this.onPlayerReady = function () {
                _this.videoId = _this.getCurrentVideoId();
            };
            this.onPlayerStateChange = function (e) {
                if (_this.videoId !== _this.getCurrentVideoId()) {
                    return;
                }
                if (e.data === root.YT.PlayerState.PLAYING) {
                    _this.start();
                }
                else if (e.data === root.YT.PlayerState.PAUSED) {
                    _this.stop();
                }
                else if (e.data === root.YT.PlayerState.ENDED) {
                    _this.stop();
                    _this.setState({ text: null });
                }
            };
            if (iframe.youtubeExternalSubtitle) {
                throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
            }
            iframe.youtubeExternalSubtitle = this;
            if (!root.document.getElementById(CSS.ID)) {
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
                _this.element = root.document.createElement('div');
                _this.element.youtubeExternalSubtitle = _this;
                iframe.parentNode.insertBefore(_this.element, iframe.nextSibling);
                _this.render();
                _this.player.addEventListener('onReady', _this.onPlayerReady);
                _this.player.addEventListener('onStateChange', _this.onPlayerStateChange);
            });
        }
        Subtitle.prototype.load = function (subtitles) {
            this.cache = buildCache(subtitles);
        };
        Subtitle.prototype.hasClass = function (cls) {
            return this.state.classes.indexOf(cls) !== -1;
        };
        Subtitle.prototype.addClass = function (cls) {
            if (this.hasClass(cls)) {
                return;
            }
            this.setState({
                classes: __spreadArrays(this.state.classes, [
                    cls
                ])
            });
        };
        Subtitle.prototype.removeClass = function (cls) {
            if (!this.hasClass(cls)) {
                return;
            }
            var classes = __spreadArrays(this.state.classes);
            var index = classes.indexOf(cls);
            if (index > -1) {
                classes.splice(index, 1);
            }
            this.setState({ classes: classes });
        };
        Subtitle.prototype.destroy = function () {
            this.stop();
            this.element.parentNode.removeChild(this.element);
            this.player.getIframe().youtubeExternalSubtitle = null;
            this.player.removeEventListener('onReady', this.onPlayerReady);
            this.player.removeEventListener('onStateChange', this.onPlayerStateChange);
        };
        Subtitle.prototype.render = function () {
            if (this.state.text === null) {
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
            this.element.innerHTML = "<span>" + this.state.text.replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>') + "</span>";
            this.element.className = CSS.CLASS + " " + this.state.classes.join(' ');
            this.element.style.display = 'block';
            this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
            this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
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
            var _this = this;
            this.stop();
            this.timeChangeInterval = setInterval(function () { return _this.onTimeChange(); }, 500);
        };
        Subtitle.prototype.stop = function () {
            clearInterval(this.timeChangeInterval);
        };
        Subtitle.prototype.getCurrentVideoId = function () {
            return this.player.getVideoData().video_id;
        };
        Subtitle.prototype.onTimeChange = function () {
            var subtitle = getSubtitleFromCache(this.player.getCurrentTime(), this.cache);
            this.setState({ text: subtitle ? subtitle.text : null });
        };
        return Subtitle;
    }());

    var youtube_external_subtitle = { Subtitle: Subtitle };

    return youtube_external_subtitle;

})));
