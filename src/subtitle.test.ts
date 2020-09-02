import DIC, { Youtube } from './dic';
import InitService from './init.service';
import Subtitle, {
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

const getSubtitleFrame = (src: string): SubtitleFrame => {
  const parentNode: Partial<ParentNode & Node> = {
    insertBefore: jest.fn()
  };

  return {
    src: src,
    parentNode: parentNode as ParentNode & Node
  } as SubtitleFrame;
};

test('new Subtitle() returns a correct Subtitle instance', () => {
  DIC.setInitService({
    grantGlobalStyles: () => {},
    grantIframeApi: (cb) => {
      cb();
    }
  } as InitService);

  const fakeElement = {
    style: {}
  } as HTMLElement;

  const document = {
    createElement: (): HTMLElement => {
      return fakeElement;
    }
  } as Partial<Document>;

  DIC.setDocument(document as Document);

  const fakePlayerAddEventListener = jest.fn();

  const fakePlayer = () => ({
    addEventListener: fakePlayerAddEventListener
  });

  DIC.setYT({ Player: fakePlayer } as Youtube);

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

  const subtitle = new Subtitle(subtitleFrame, subtitles);

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
  expect(subtitle['player']).toBeTruthy();
  expect(fakePlayerAddEventListener).toHaveBeenCalledWith('onReady', subtitle['onPlayerReady']);
  expect(fakePlayerAddEventListener).toHaveBeenCalledWith('onStateChange', subtitle['onPlayerStateChange']);

  const subtitleFrame2 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');
  subtitleFrame2.youtubeExternalSubtitle = {} as Subtitle;

  expect(() => {
    new Subtitle(subtitleFrame2, subtitles);
  }).toThrow('YoutubeExternalSubtitle: subtitle is already added for this element');

  const subtitleFrame3 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');

  const subtitle3 = new Subtitle(subtitleFrame3, subtitles);

  expect(subtitleFrame3.src).toBe('https://www.youtube.com/embed/fGPPfZIvtCw?enablejsapi=1&html5=1&playsinline=1&fs=0');

  const subtitleFrame4 = getSubtitleFrame('https://www.youtube.com/embed/fGPPfZIvtCw');

  const subtitle4 = new Subtitle(subtitleFrame4);

  expect(subtitle4['cache']).toEqual({});
});
