import DIC, { Youtube } from './dic';
import InitService from './init.service';
import Subtitle, {
  SubtitleElement,
  SubtitleFrame,
  State,
  getCacheName,
  getCacheNames,
  buildCache,
  getSubtitleFromCache,
  addQueryStringParameterToUrl,
  getIframeSrc,
  createSubtitleElement,
  isStateChanged,
  renderClassName,
  renderText,
  renderSubtitle,
  getFrameRect
} from './subtitle';

test('getCacheName returns the correct cache name', () => {
  expect(getCacheName(39)).toStrictEqual(3);
  expect(getCacheName(39.9)).toStrictEqual(3);
  expect(getCacheName(40)).toStrictEqual(4);
  expect(getCacheName(0)).toStrictEqual(0);
});

test('getCacheNames returns the correct cache names', () => {
  expect(getCacheNames(10, 33)).toStrictEqual([1, 2, 3]);
  expect(getCacheNames(11, 12)).toStrictEqual([1]);
});

test('buildCache returns the correct cache', () => {
  const subtitles = [
    { start: 1.5, end: 4, text: 'fakeText1' },
    { start: 5, end: 9.8, text: 'fakeText2' },
    { start: 9.9, end: 12, text: 'fakeText3' },
  ];

  const expectedCache = {
    0: [
      { start: 1.5, end: 4, text: 'fakeText1' },
      { start: 5, end: 9.8, text: 'fakeText2' },
      { start: 9.9, end: 12, text: 'fakeText3' }
    ],
    1: [
      { start: 9.9, end: 12, text: 'fakeText3' }
    ]
  };

  expect(buildCache(subtitles)).toStrictEqual(expectedCache);
});

test('getSubtitleFromCache returns the correct subtitle', () => {
  const cache = {
    0: [
      { start: 1.5, end: 4, text: 'fakeText1' },
      { start: 5, end: 9.8, text: 'fakeText2' },
      { start: 9.9, end: 12, text: 'fakeText3' }
    ],
    1: [
      { start: 9.9, end: 12, text: 'fakeText3' }
    ]
  };

  expect(getSubtitleFromCache(10, null)).toStrictEqual(null);
  expect(getSubtitleFromCache(22, cache)).toStrictEqual(null);
  expect(getSubtitleFromCache(14, cache)).toStrictEqual(null);

  expect(getSubtitleFromCache(10, cache)).toStrictEqual({ start: 9.9, end: 12, text: 'fakeText3' });
});

test('addQueryStringParameterToUrl returns the correct url', () => {
  expect(addQueryStringParameterToUrl('http://example.com/', {})).toBe('http://example.com/');
  expect(addQueryStringParameterToUrl('http://example.com/', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=fakeValue');
  expect(addQueryStringParameterToUrl('http://example.com/?fakeParameter=prevValue', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=prevValue&fakeParameter=fakeValue');
  expect(addQueryStringParameterToUrl('http://example.com/#hashPart', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=fakeValue#hashPart');
});

test('getIframeSrc returns the correct src', () => {
  expect(getIframeSrc('https://www.youtube.com/embed/fGPPfZIvtCw')).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');
  expect(getIframeSrc('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=0&html5=0&playsinline=0&fs=1')).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=0&html5=0&playsinline=0&fs=1&enablejsapi=1&html5=1&playsinline=1');
  expect(getIframeSrc('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0')).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');
});

test('createSubtitleElement creates the correct subtitle element', () => {
  const insertHandler = jest.fn();
  const nextSibling = {} as ChildNode;
  const subtitle = {} as Subtitle;

  const parentNode: Partial<ParentNode & Node> = {
    insertBefore: insertHandler
  };

  const document = {
    createElement: (): HTMLElement => {
      return {} as HTMLElement;
    }
  } as Partial<Document>;

  DIC.setDocument(document as Document);

  const element = createSubtitleElement({
    parentNode: parentNode as ParentNode & Node,
    nextSibling
  } as SubtitleFrame, subtitle);

  expect(element.youtubeExternalSubtitle).toBe(subtitle);

  expect(insertHandler).toHaveBeenCalledWith(element, nextSibling);
});

test('isStateChanged returns the correct result', () => {
  expect(isStateChanged({ text: 'value' } as State, {} as State)).toBe(false);
  expect(isStateChanged({} as State, { text: 'value' } as State)).toBe(true);
  expect(isStateChanged({ text: 'value' } as State, { text: 'value' } as State)).toBe(false);
  expect(isStateChanged({ text: 'value' } as State, { text: 'value2' } as State)).toBe(true);
});

test('renderClassName returns the correct className', () => {
  expect(renderClassName(null)).toBe('youtube-external-subtitle');
  expect(renderClassName(false)).toBe('youtube-external-subtitle fullscreen-ignore');
  expect(renderClassName(true)).toBe('youtube-external-subtitle fullscreen');
});

test('renderText returns the correct text', () => {
  expect(renderText(null)).toBe('<span></span>');
  expect(renderText('fake subtitle text')).toBe('<span>fake subtitle text</span>');
  expect(renderText('fake subtitle text\nwith new line')).toBe('<span>fake subtitle text</span><br /><span>with new line</span>');
});

test('getFrameRect returns the correct frame rectangle', () => {
  const frame1 = {
    offsetWidth: 600, offsetHeight: 400,
    offsetLeft: 10, offsetTop: 100,
    scrollLeft: 5, scrollTop: 0,
    clientLeft: 0, clientTop: 10
  } as SubtitleFrame;

  expect(getFrameRect(frame1, false)).toEqual({
    height: 400, width: 600,
    x: 5, y: 110,
    bottomPadding: 60
  });

  expect(getFrameRect(frame1, true)).toEqual({
    height: 400, width: 600,
    x: 5, y: 110,
    bottomPadding: 60
  });

  const frame2 = {
    offsetWidth: 200, offsetHeight: 150,
    offsetLeft: 10, offsetTop: 100,
    scrollLeft: 5, scrollTop: 0,
    clientLeft: 0, clientTop: 10
  } as SubtitleFrame;

  expect(getFrameRect(frame2, false)).toEqual({
    height: 150, width: 200,
    x: 5, y: 110,
    bottomPadding: 20
  });

  expect(getFrameRect(frame2, true)).toEqual({
    height: 150, width: 200,
    x: 5, y: 110,
    bottomPadding: 60
  });
});

test('renderSubtitle displays the subtitles correctly', () => {
  const fakeElement = {
    style: {},
    parentNode: {
      removeChild: jest.fn()
    } as Partial<ParentNode & Node>,
    offsetWidth: 196,
    offsetHeight: 40
  } as SubtitleElement;

  renderSubtitle(fakeElement, null, true, null, true);

  expect(fakeElement.className).toBe('youtube-external-subtitle fullscreen');
  expect(fakeElement.innerHTML).toBe('<span></span>');
  expect(fakeElement.style.display).toBe('');

  renderSubtitle(fakeElement, null, true, 'PO: Master Shifu?', true);

  expect(fakeElement.innerHTML).toBe('<span>PO: Master Shifu?</span>');
  expect(fakeElement.style.display).toBe('block');

  const fakePlayer = {
    getIframe: () => {
      return {
        offsetLeft: 88,
        scrollLeft: 0,
        clientLeft: 0,
        offsetTop: 174,
        scrollTop: 0,
        clientTop: 0,
        offsetWidth: 1140,
        offsetHeight: 400,
      } as SubtitleFrame;
    }
  };

  renderSubtitle(fakeElement, fakePlayer, true, 'PO: Master Shifu?', true);

  expect(fakeElement.style.display).toBe('block');
  expect(fakeElement.style.visibility).toBe('');
  expect(fakeElement.style.top).toBe('474px');
  expect(fakeElement.style.left).toBe('560px');
  expect(fakeElement.style.maxWidth).toBe('1120px');
  expect(fakeElement.style.fontSize).toBe('1.5384615384615385em');
});

const getSubtitleFrame = (src: string): SubtitleFrame => {
  const parentNode: Partial<ParentNode & Node> = {
    insertBefore: jest.fn()
  };

  return {
    src: src,
    parentNode: parentNode as ParentNode & Node
  } as SubtitleFrame;
};

const setDICServices = (
  fakeElement: HTMLElement,
  initServiceAddSubtitle: Function,
  initServiceRemoveSubtitle: Function,
  playerAddEventListener: Function,
  playerRemoveEventListener: Function
) => {
  const initService = {
    grantGlobalStyles: () => {},
    grantIframeApi: (cb) => {
      cb();
    }
  } as InitService;

  initService.addSubtitle = initServiceAddSubtitle === null ? () => {} : initServiceAddSubtitle as any;
  initService.removeSubtitle = initServiceRemoveSubtitle === null ? () => {} : initServiceRemoveSubtitle as any;

  DIC.setInitService(initService);

  const document = {
    createElement: (): HTMLElement => {
      return fakeElement === null
        ? {
            style: {}
          } as HTMLElement
        : fakeElement;
    }
  } as Partial<Document>;

  DIC.setDocument(document as Document);

  DIC.setYT({
    Player: (iframe: SubtitleFrame) => ({
      addEventListener: playerAddEventListener === null
        ? () => {}
        : playerAddEventListener,
      removeEventListener: playerRemoveEventListener === null
        ? () => {}
        : playerRemoveEventListener,
      getIframe: () => {
        return iframe;
      }
    })
  } as Youtube);
};

test('new Subtitle() returns a correct Subtitle instance', () => {
  const fakeElement = {
    style: {}
  } as HTMLElement;

  const fakePlayerAddEventListener = jest.fn();
  const fakeInitServiceAddSubtitle = jest.fn();

  setDICServices(fakeElement, fakeInitServiceAddSubtitle, null, fakePlayerAddEventListener, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitles = [
    {
      'start': 10,
      'end': 11,
      'text': 'PO: Master Shifu?'
    },
    {
      'start': 13,
      'end': 14,
      'text': 'Good time? Bad time?'
    }
  ];

  const fakeRenderMethod = jest.fn();

  const subtitle = new Subtitle(subtitleFrame, subtitles, fakeRenderMethod);

  expect(subtitle).toBeInstanceOf(Subtitle);
  expect(subtitleFrame.youtubeExternalSubtitle).toBe(subtitle);
  expect(subtitleFrame.src).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');
  expect(subtitle['cache']).toEqual({
    1: [
      {
        'end': 11,
        'start': 10,
        'text': 'PO: Master Shifu?'
      },
      {
        'end': 14,
        'start': 13,
        'text': 'Good time? Bad time?'
      }
    ]
  });
  expect(subtitle['element']).toBe(fakeElement);
  expect(subtitle['renderMethod']).toBe(fakeRenderMethod);
  expect(fakeInitServiceAddSubtitle).toHaveBeenCalledTimes(1);
  expect(subtitle['player']).toBeTruthy();
  expect(DIC.getYT().Player().addEventListener).toHaveBeenCalledWith('onReady', subtitle['onPlayerReady']);
  expect(DIC.getYT().Player().addEventListener).toHaveBeenCalledWith('onStateChange', subtitle['onPlayerStateChange']);

  const subtitleFrame2 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');
  subtitleFrame2.youtubeExternalSubtitle = {} as Subtitle;

  expect(() => {
    new Subtitle(subtitleFrame2, subtitles);
  }).toThrow('YoutubeExternalSubtitle: subtitle is already added for this element');
  expect(fakeInitServiceAddSubtitle).toHaveBeenCalledTimes(1);

  const subtitleFrame3 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');

  const subtitle3 = new Subtitle(subtitleFrame3, subtitles);

  expect(subtitle3['renderMethod']).toBe(renderSubtitle);
  expect(subtitleFrame3.src).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');

  const subtitleFrame4 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle4 = new Subtitle(subtitleFrame4);

  expect(subtitle4['cache']).toEqual({});
});

test('load loads the subtitles properly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  expect(subtitle['cache']).toEqual({});

  subtitle.load([
    {
      'start': 10,
      'end': 11,
      'text': 'PO: Master Shifu?'
    },
    {
      'start': 13,
      'end': 14,
      'text': 'Good time? Bad time?'
    }
  ]);

  expect(subtitle['cache']).toEqual({
    1: [
      {
        'end': 11,
        'start': 10,
        'text': 'PO: Master Shifu?'
      },
      {
        'end': 14,
        'start': 13,
        'text': 'Good time? Bad time?'
      }
    ]
  });
});

test('setIsFullscreenActive sets isFullscreenActive', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  expect(subtitle['state'].isFullscreenActive).toBe(null);

  subtitle.setIsFullscreenActive(true);

  expect(subtitle['state'].isFullscreenActive).toBe(true);

  subtitle.setIsFullscreenActive(false);

  expect(subtitle['state'].isFullscreenActive).toBe(false);
});

test('destroy removes the subtitle instance', () => {
  const fakeElement = {
    style: {},
    parentNode: {
      removeChild: jest.fn()
    } as Partial<ParentNode & Node>
  } as HTMLElement;

  const fakePlayerRemoveEventListener = jest.fn();
  const fakeInitServiceRemoveSubtitle = jest.fn();

  setDICServices(fakeElement, null, fakeInitServiceRemoveSubtitle, null, fakePlayerRemoveEventListener);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakeStopMethod = jest.fn();

  subtitle['stop'] = fakeStopMethod;

  subtitle.destroy();

  expect(fakeStopMethod).toHaveBeenCalled();
  expect(fakeElement.parentNode.removeChild).toHaveBeenCalledWith(fakeElement);
  expect(subtitleFrame.youtubeExternalSubtitle).toBe(null);
  expect(DIC.getYT().Player().removeEventListener).toHaveBeenCalledWith('onReady', subtitle['onPlayerReady']);
  expect(DIC.getYT().Player().removeEventListener).toHaveBeenCalledWith('onStateChange', subtitle['onPlayerStateChange']);
  expect(fakeInitServiceRemoveSubtitle).toHaveBeenCalled();
});

test('render calls the correct renderMethod', () => {
  const fakeElement = {
    style: {}
  } as HTMLElement;

  setDICServices(fakeElement, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const fakeRenderMethod = jest.fn();

  const subtitle = new Subtitle(subtitleFrame, [], fakeRenderMethod);

  const fakePlayer = {
    getIframe: () => {
      return {
        offsetLeft: 88,
        scrollLeft: 0,
        clientLeft: 0,
        offsetTop: 174,
        scrollTop: 0,
        clientTop: 0,
        offsetWidth: 1140,
        offsetHeight: 400,
      } as SubtitleFrame;
    }
  };
  const fakeIsFullscreenActive = true;
  const fakeText = 'fakeText';
  const fakeControlsVisible = false;

  subtitle['player'] = fakePlayer;
  subtitle['state'].isFullscreenActive = fakeIsFullscreenActive;
  subtitle['state'].text = fakeText;
  subtitle['state'].controlsVisible = fakeControlsVisible;

  fakeRenderMethod.mockClear();

  subtitle.render();

  expect(fakeRenderMethod).toHaveBeenCalledWith(fakeElement, fakePlayer, fakeIsFullscreenActive, fakeText, fakeControlsVisible);
});

test('isInContainer returns the correct result', () => {
  const fakeElement = {
    style: {},
    contains(other: Node | null): boolean {
      return false;
    }
  } as HTMLElement;

  setDICServices(fakeElement, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const notParentContainer = { contains: () => { return false; } } as Partial<Element>;
  const parentContainer = { contains: () => { return true; } } as Partial<Element>;

  expect(subtitle.isInContainer(notParentContainer as Element)).toBe(false);
  expect(subtitle.isInContainer(parentContainer as Element)).toBe(true);
  expect(subtitle.isInContainer(fakeElement)).toBe(true);
});

test('getYTPlayer returns the player', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakePlayer = {};

  subtitle['player'] = fakePlayer;

  expect(subtitle.getYTPlayer()).toBe(fakePlayer);
});

test('setState sets the state correctly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakeRender = jest.fn();

  subtitle.render = fakeRender;

  subtitle['state'].text = 'initialText';

  subtitle['setState']({ text: 'initialText' });

  expect(subtitle['state'].text).toBe('initialText');
  expect(fakeRender).not.toHaveBeenCalled();

  subtitle['setState']({ text: 'fakeText' });

  expect(subtitle['state'].text).toBe('fakeText');
  expect(fakeRender).toHaveBeenCalled();
});

test('start starts the subtitle correctly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakeStop = jest.fn();
  const fakeOnTimeChange = jest.fn();
  const fakeSetInterval = jest.fn();
  const fakeSetTimeout = jest.fn();

  subtitle['stop'] = fakeStop;
  subtitle['onTimeChange'] = fakeOnTimeChange;

  const window = {
    setInterval: fakeSetInterval,
    setTimeout: fakeSetTimeout
  } as Partial<Window>;

  DIC.setWindow(window as Window);

  subtitle['start']();

  expect(fakeStop).toHaveBeenCalled();
  expect(fakeSetInterval).toHaveBeenCalledWith(subtitle['onTimeChange'], 500);
  expect(fakeSetTimeout).toHaveBeenCalledWith(subtitle['onControlsHide'], 3000);
  expect(fakeOnTimeChange).toHaveBeenCalled();
});

test('stop stops the subtitle correctly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakeSetState = jest.fn();
  const fakeClearInterval = jest.fn();
  const fakeClearTimeout = jest.fn();

  subtitle['setState'] = fakeSetState;

  const window = {
    clearInterval: fakeClearInterval,
    clearTimeout: fakeClearTimeout
  } as Partial<Window>;

  DIC.setWindow(window as Window);

  subtitle['stop']();

  expect(fakeClearInterval).toHaveBeenCalledWith(subtitle['timeChangeInterval']);
  expect(fakeClearTimeout).toHaveBeenCalledWith(subtitle['controlsHideTimeout']);
  expect(fakeSetState).toHaveBeenCalledWith({ controlsVisible: true });
});

test('getCurrentVideoId returns the correct video id', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  subtitle['player'] = {
    getVideoData: () => {
      return {
        video_id: 'fakeVideoId',
      };
    }
  };

  expect(subtitle['getCurrentVideoId']()).toBe('fakeVideoId');
});

test('onTimeChange sets the correct text', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  subtitle['cache'] = {
    1: [
      {
        'end': 11,
        'start': 10,
        'text': 'PO: Master Shifu?'
      },
      {
        'end': 14,
        'start': 13,
        'text': 'Good time? Bad time?'
      }
    ]
  };

  subtitle['player'] = {
    getIframe: () => {
      return subtitleFrame;
    },
    getCurrentTime: () => {
      return 1.12;
    }
  };

  subtitle['onTimeChange']();

  expect(subtitle['state'].text).toBe(null);

  subtitle['player'] = {
    getIframe: () => {
      return subtitleFrame;
    },
    getCurrentTime: () => {
      return 10.12;
    }
  };

  subtitle['onTimeChange']();

  expect(subtitle['state'].text).toBe('PO: Master Shifu?');
});

test('onPlayerReady sets the correct video id', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  subtitle['getCurrentVideoId'] = () => 'fakeVideoId';

  subtitle['onPlayerReady']();

  expect(subtitle['videoId']).toBe('fakeVideoId');
});

test('onControlsHide sets controlsVisible correctly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  subtitle['state'].controlsVisible = true;

  subtitle['onControlsHide']();

  expect(subtitle['state'].controlsVisible).toBe(false);
});

test('onPlayerStateChange handles the change correctly', () => {
  setDICServices(null, null, null, null, null);

  const subtitleFrame = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle = new Subtitle(subtitleFrame, []);

  const fakeStart = jest.fn();
  const fakeStop = jest.fn();
  const fakeSetState = jest.fn();

  subtitle['start'] = fakeStart;
  subtitle['stop'] = fakeStop;
  subtitle['setState'] = fakeSetState;
  subtitle['getCurrentVideoId'] = () => 'fakeVideoId';

  subtitle['videoId'] = 'differentVideoId';

  const fakeYT = {
    PlayerState: {
      PLAYING: 'playing',
      PAUSED: 'paused',
      ENDED: 'ended',
      FAKE_EVENT: 'fakeEvent'
    }
  };

  DIC.setYT(fakeYT as Youtube);

  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.PLAYING });
  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.PAUSED });
  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.ENDED });

  expect(fakeStart).not.toHaveBeenCalled();
  expect(fakeStop).not.toHaveBeenCalled();
  expect(fakeSetState).not.toHaveBeenCalled();

  subtitle['videoId'] = 'fakeVideoId';

  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.FAKE_EVENT });

  expect(fakeStart).not.toHaveBeenCalled();
  expect(fakeStop).not.toHaveBeenCalled();
  expect(fakeSetState).not.toHaveBeenCalled();

  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.PLAYING });

  expect(fakeStart).toHaveBeenCalledTimes(1);
  expect(fakeStop).not.toHaveBeenCalled();
  expect(fakeSetState).not.toHaveBeenCalled();

  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.PAUSED });

  expect(fakeStart).toHaveBeenCalledTimes(1);
  expect(fakeStop).toHaveBeenCalledTimes(1);
  expect(fakeSetState).not.toHaveBeenCalled();

  subtitle['onPlayerStateChange']({ data: fakeYT.PlayerState.ENDED });

  expect(fakeStart).toHaveBeenCalledTimes(1);
  expect(fakeStop).toHaveBeenCalledTimes(2);
  expect(fakeSetState).toHaveBeenCalledWith({ text: null });
});
