(function(root, factory) {
	// Set up YoutubeExternalSubtitle appropriately for the environment. Start with AMD.
	if (typeof define === 'function' && define.amd) {
		define(['exports'], function(exports) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global YoutubeExternalSubtitle.
			root.YoutubeExternalSubtitle = factory(root, exports);
		});
	}
	// Next for CommonJS.
	else if (typeof exports !== 'undefined') {
		factory(root, exports);
	}
	// Finally, as a browser global.
	else {
		root.YoutubeExternalSubtitle = factory(root, {});
	}
}(this, function(root, YoutubeExternalSubtitle) {
	'use strict';

	var iframeApiLoaded = function() {
		return !!(root.YT && root.YT.Player);
	};

	var proxy = function(func, context) {
		return function() {
			return func.apply(context, arguments);
		};
	};

	var addClass = function(element, cls) {
		if (!hasClass(element, cls)) {
			element.className += (element.className ? ' ' : '') + cls;
		}
	};

	var hasClass = function(element, cls) {
		return element.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
	};

	var removeClass = function(element, cls) {
		if (hasClass(element, cls)) {
			var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');

			element.className = element.className.replace(reg, ' ');
		}
	};

	var getYouTubeIDFromUrl = function(url) {
		var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);

		if (match && match[7].length === 11) {
			return match[7];
		}
		else {
			return false;
		}
	};

	var addQueryStringParameterToUrl = function(url, qsParameters) {
		var hashIndex = url.indexOf('#');
		var hash      = '';

		if (hashIndex !== -1) {
			hash = url.substr(hashIndex);
			url  = url.substr(0, hashIndex);
		}

		var qsIndex = url.indexOf('?');
		var qs      = '';

		if (qsIndex !== -1) {
			qs  = url.substr(qsIndex);
			url = url.substr(0, qsIndex);
		}

		for (var i in qsParameters) {
			qs += (qs === '' ? '?' : '&') + i + '=' + qsParameters[i];
		}

		return url + qs + hash;
	};

	var getCacheName = function(seconds) {
		return Math.floor(seconds / 10);
	};

	var buildCache = function(subtitles) {
		var cache = {};

		for (var i in subtitles) {
			var subtitle = subtitles[i];

			var startCache = getCacheName(subtitle.start);
			var endCache = getCacheName(subtitle.end);

			if (!cache[startCache]) {
				cache[startCache] = [];
			}

			cache[startCache].push(subtitle);

			if (startCache !== endCache) {
				if (!cache[endCache]) {
					cache[endCache] = [];
				}

				cache[endCache].push(subtitle);
			}
		}

		return cache;
	};

	var iframeApiScriptAdded = function() {
		var scripts = root.document.getElementsByTagName('script');

		for (var i = 0; i < scripts.length; i++) {
			var src = scripts[i].src;

			if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
				return true;
			}
		}

		return false;
	};

	var loadIframeApi = function(cb) {
		if (iframeApiLoaded()) {
			cb();

			return;
		}

		var iframeApiInterval = setInterval(function() {
			if (iframeApiLoaded()) {
				clearInterval(iframeApiInterval);

				cb();
			}
		}, 100);

		if (!iframeApiScriptAdded()) {
			var tag = root.document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			var firstScriptTag = root.document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}
	};

	var fullscreenChangeHandler = function(e) {
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

						setTimeout(function() {
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

	var firstInit = function() {
		var style       = root.document.createElement('style');
		style.id        = 'youtube-external-subtitle-style';
		style.type      = 'text/css';
		style.innerHTML = ".youtube-external-subtitle { position: absolute; display: none; z-index: 0; pointer-events: none; color: #fff; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 17px; text-align: center; } .youtube-external-subtitle span { background: #000; padding: 1px 4px; display: inline-block; margin-bottom: 2px; } .youtube-external-subtitle.fullscreen-ignore { display: none !important; } .youtube-external-subtitle.fullscreen { z-index: 3000000000; }";

		var head = root.document.getElementsByTagName('head')[0] || root.document.documentElement;
		head.insertBefore(style, head.firstChild);

		root.document.addEventListener('fullscreenchange', fullscreenChangeHandler);
		root.document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
		root.document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
		root.document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
	};

	var Subtitle = YoutubeExternalSubtitle.Subtitle = function(iframe, subtitles) {
		this.subtitle           = null;
		this.cache              = null;
		this.timeChangeInterval = 0;
		this.player             = null;
		this.videoId            = null;
		this.element            = null;

		if (iframe.youtubeExternalSubtitle) {
			throw new Error('YoutubeExternalSubtitle: subtitle is already added for this element');
		}

		iframe.youtubeExternalSubtitle = this;

		if (!root.document.getElementById('youtube-external-subtitle-style')) {
			firstInit();
		}

		var newSrc = iframe.src;

		if (newSrc.indexOf('enablejsapi=1') === -1) {
			newSrc = addQueryStringParameterToUrl(newSrc, { enablejsapi: '1' });
		}

		if (newSrc.indexOf('html5=1') === -1) {
			newSrc = addQueryStringParameterToUrl(newSrc, { html5: '1' });
		}

		if (iframe.src !== newSrc) {
			iframe.src = newSrc;
		}

		if (subtitles) {
			this.cache = buildCache(subtitles);
		}

		loadIframeApi(proxy(function() {
			this.player  = new root.YT.Player(iframe);
			this.videoId = this.getCurrentVideoId();

			this.element = root.document.createElement('div');
			addClass(this.element, 'youtube-external-subtitle');

			this.element.parentFrame = iframe;

			iframe.parentNode.insertBefore(this.element, iframe.nextSibling);

			this.player.addEventListener('onStateChange', proxy(this.onStateChange, this));
		}, this));
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
		var videoUrl = this.player.getVideoEmbedCode().match(/src="(.*?)"/)[1];

		return getYouTubeIDFromUrl(videoUrl);
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

			this.subtitle = null;

			this.render();
		}
	};

	Subtitle.prototype.onTimeChange = function() {
		var subtitle = this.getSubtitleFromCache(this.player.getCurrentTime());

		if (this.subtitle === subtitle) {
			return;
		}

		this.subtitle = subtitle;

		this.render();
	};

	Subtitle.prototype.getSubtitleFromCache = function(seconds) {
		if (!this.cache) {
			return null;
		}

		var cache = this.cache[getCacheName(seconds)];

		if (!cache) {
			return null;
		}

		for (var i in cache) {
			if (seconds >= cache[i].start && seconds <= cache[i].end) {
				return cache[i];
			}
		}

		return null;
	};

	Subtitle.prototype.render = function() {
		if (this.subtitle === null) {
			this.element.style.display = '';
		}
		else {
			var iframe = this.player.getIframe();

			var frame = {
				x      : iframe.offsetLeft - iframe.scrollLeft + iframe.clientLeft,
				y      : iframe.offsetTop - iframe.scrollTop + iframe.clientTop,
				width  : iframe.offsetWidth,
				height : iframe.offsetHeight
			};

			this.element.innerHTML = '<span>' + this.subtitle.text.replace(/(?:\r\n|\r|\n)/g, '</span><br /><span>') + '</span>';
			this.element.style.display = 'block';
			this.element.style.top = (frame.y + frame.height - 60 - this.element.offsetHeight) + 'px';
			this.element.style.left = (frame.x + (frame.width - this.element.offsetWidth) / 2) + 'px';
		}
	};

	return YoutubeExternalSubtitle;

}));
