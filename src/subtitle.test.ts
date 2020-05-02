import Subtitle, {
  SubtitleElement,
  getCacheName,
  getCacheNames,
  buildCache,
  getSubtitleFromCache,
  getFullscreenElement,
  getSubtitles,
  getFullscreenSubtitle,
  fullscreenChangeHandler
} from './subtitle';
import DIC from './dic';

declare global {
  namespace jest {
    interface Matchers<R> {
      arrayItemsToBe(a: any[]): R;
    }
  }
}

expect.extend({
  arrayItemsToBe(received: any[], expected: any[]): any {
    const getResult = (pass: boolean): any => {
      return {
        message: () => `expected ${received} to be ${expected}`,
        pass,
      };
    };

    if (received.length !== expected.length) {
      return getResult(false);
    }

    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== received[i]) {
        return getResult(false);
      }
    }

    return getResult(true);
  },
});

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

test('getFullscreenElement returns the correct element', () => {
  const standard = {};
  const webkit = {};
  const webkitCurrent = {};
  const moz = {};
  const ms = {};

  const getDocument = (
    fullscreenElement,
    webkitFullscreenElement,
    webkitCurrentFullScreenElement,
    mozFullScreenElement,
    msFullscreenElement
  ) => {
    return {
      fullscreenElement,
      webkitFullscreenElement,
      webkitCurrentFullScreenElement,
      mozFullScreenElement,
      msFullscreenElement
    } as Document;
  };

  expect(getFullscreenElement(
    getDocument(standard, webkit, webkitCurrent, moz, ms)
  )).toBe(standard);

  expect(getFullscreenElement(
    getDocument(undefined, webkit, webkitCurrent, moz, ms)
  )).toBe(webkit);

  expect(getFullscreenElement(
    getDocument(undefined, undefined, webkitCurrent, moz, ms)
  )).toBe(webkitCurrent);

  expect(getFullscreenElement(
    getDocument(undefined, undefined, undefined, moz, ms)
  )).toBe(moz);

  expect(getFullscreenElement(
    getDocument(undefined, undefined, undefined, undefined, ms)
  )).toBe(ms);
});

const createContainerMock = (results: any[]): Element => {
  const container: Partial<Element> = {
    getElementsByClassName: (classNames: string): HTMLCollectionOf<Element> => {
      return results as any;
    }
  };

  return container as Element;
};

test('getSubtitles returns the correct subtitles', () => {
  expect(getSubtitles(createContainerMock([]))).toStrictEqual([]);

  const subtitle1 = {};
  const subtitle2 = {};

  expect(getSubtitles(createContainerMock([
    { youtubeExternalSubtitle: subtitle1 },
    { youtubeExternalSubtitle: subtitle2 }
  ]))).arrayItemsToBe([ subtitle1, subtitle2 ]);
});

test('getFullscreenSubtitle returns the correct subtitle', () => {
  const subtitle1 = {};
  const subtitle2 = {};

  expect(getFullscreenSubtitle(undefined)).toBe(null);
  expect(getFullscreenSubtitle({ youtubeExternalSubtitle: subtitle1 } as SubtitleElement)).toBe(subtitle1);
  expect(getFullscreenSubtitle(createContainerMock([
    { youtubeExternalSubtitle: subtitle2 },
    { youtubeExternalSubtitle: subtitle1 }
  ]) as SubtitleElement)).toBe(subtitle2);
  expect(getFullscreenSubtitle(createContainerMock([]) as SubtitleElement)).toBe(null);
});

test('fullscreenChangeHandler sets subtitles state correctly', () => {
  const subtitle1 = { setIsFullscreenActive: jest.fn() } as any;
  const subtitle2 = { setIsFullscreenActive: jest.fn() } as any;
  const fullscreenElement = { youtubeExternalSubtitle: subtitle2 } as SubtitleElement;

  const container: Partial<Document> = {
    getElementsByClassName: (classNames: string): HTMLCollectionOf<Element> => {
      return [
        { youtubeExternalSubtitle: subtitle1 },
        { youtubeExternalSubtitle: subtitle2 }
      ] as any;
    },
    fullscreenElement: fullscreenElement
  };

  const document = container as Document;

  DIC.setDocument(document);

  fullscreenChangeHandler();

  expect(subtitle1.setIsFullscreenActive).toHaveBeenCalledWith(false);
  expect(subtitle2.setIsFullscreenActive).toHaveBeenCalledWith(true);
});
