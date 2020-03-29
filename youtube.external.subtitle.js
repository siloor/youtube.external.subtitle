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
    var proxy = function (func, context) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return func.apply(context, args);
        };
    };
    var getYouTubeIDFromUrl = function (url) {
        var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
        return match && match[7].length === 11 ? match[7] : null;
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
    var getFullscreenSubtitleElement = function () {
        var fullscreenElement = root.document.fullscreenElement ||
            root.document.webkitFullscreenElement ||
            root.document.webkitCurrentFullScreenElement ||
            root.document.mozFullScreenElement ||
            root.document.msFullscreenElement;
        var element = null;
        if (fullscreenElement) {
            if (fullscreenElement.youtubeExternalSubtitle) {
                element = fullscreenElement.youtubeExternalSubtitle.element;
            }
            else {
                var elements = fullscreenElement.getElementsByClassName('youtube-external-subtitle');
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
    var fullscreenChangeHandler = function (e) {
        var _a = getFullscreenSubtitleElement(), fullscreenSubtitleElement = _a.element, isFullscreen = _a.isFullscreen;
        var subtitles = root.document.getElementsByClassName('youtube-external-subtitle');
        var _loop_1 = function (i) {
            var subtitle = subtitles[i].youtubeExternalSubtitle;
            if (isFullscreen) {
                var isFullscreenElement = fullscreenSubtitleElement === subtitle.element;
                subtitle.addClass(isFullscreenElement ? 'fullscreen' : 'fullscreen-ignore');
                if (isFullscreenElement) {
                    setTimeout(function () {
                        subtitle.render();
                    }, 0);
                }
            }
            else {
                var isFullscreenElement = subtitle.hasClass('fullscreen');
                subtitle.removeClass(isFullscreenElement ? 'fullscreen' : 'fullscreen-ignore');
            }
        };
        for (var i = 0; i < subtitles.length; i++) {
            _loop_1(i);
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
                _this.element.youtubeExternalSubtitle = _this;
                iframe.parentNode.insertBefore(_this.element, iframe.nextSibling);
                _this.render();
                _this.player.addEventListener('onStateChange', proxy(_this.onStateChange, _this));
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
            this.element.className = "youtube-external-subtitle " + this.state.classes.join(' ');
            this.element.style.display = 'block';
            this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
            this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
        };
        Subtitle.prototype.setState = function (state) {
            var prevState = this.state;
            var nextState = __assign(__assign({}, prevState), state);
            var changed = false;
            for (var i in nextState) {
                if (prevState[i] !== nextState[i]) {
                    changed = true;
                    break;
                }
            }
            if (!changed) {
                return;
            }
            this.state = nextState;
            this.render();
        };
        Subtitle.prototype.start = function () {
            this.stop();
            this.timeChangeInterval = setInterval(proxy(this.onTimeChange, this), 500);
        };
        Subtitle.prototype.stop = function () {
            clearInterval(this.timeChangeInterval);
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
                this.setState({ text: null });
            }
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
