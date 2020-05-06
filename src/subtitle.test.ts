import Subtitle, {
  SubtitleElement,
  getCacheName,
  getCacheNames,
  buildCache,
  getSubtitleFromCache,
  getFullscreenElement,
  getSubtitles,
  getFullscreenSubtitle,
  fullscreenChangeHandler,
  isInitialized,
  initialize,
  addQueryStringParameterToUrl
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

const arrayToHTMLCollection = (array: any): HTMLCollectionOf<Element> => {
  return array as HTMLCollectionOf<Element>;
};

const createContainerMock = (results: SubtitleElement[]): Element => {
  const container: Partial<Element> = {
    getElementsByClassName: (classNames: string): HTMLCollectionOf<Element> => {
      return arrayToHTMLCollection(results);
    }
  };

  return container as Element;
};

const createSubtitleElement = (subtitle: Subtitle): SubtitleElement => {
  return { youtubeExternalSubtitle: subtitle } as SubtitleElement;
};

test('getSubtitles returns the correct subtitles', () => {
  expect(getSubtitles(createContainerMock([]))).toStrictEqual([]);

  const subtitle1 = {};
  const subtitle2 = {};

  expect(getSubtitles(createContainerMock([
    createSubtitleElement(subtitle1 as Subtitle),
    createSubtitleElement(subtitle2 as Subtitle)
  ]))).arrayItemsToBe([ subtitle1, subtitle2 ]);
});

test('getFullscreenSubtitle returns the correct subtitle', () => {
  const subtitle1 = {};
  const subtitle2 = {};

  expect(getFullscreenSubtitle(undefined)).toBe(null);
  expect(getFullscreenSubtitle(createSubtitleElement(subtitle1 as Subtitle))).toBe(subtitle1);
  expect(getFullscreenSubtitle(createContainerMock([
    createSubtitleElement(subtitle2 as Subtitle),
    createSubtitleElement(subtitle1 as Subtitle)
  ]) as SubtitleElement)).toBe(subtitle2);
  expect(getFullscreenSubtitle(createContainerMock([]) as SubtitleElement)).toBe(null);
});

test('fullscreenChangeHandler sets subtitles state correctly', () => {
  const subtitle1 = { setIsFullscreenActive: jest.fn() } as Partial<Subtitle>;
  const subtitle2 = { setIsFullscreenActive: jest.fn() } as Partial<Subtitle>;
  const fullscreenElement = createSubtitleElement(subtitle2 as Subtitle);

  const container: Partial<Document> = {
    getElementsByClassName: (classNames: string): HTMLCollectionOf<Element> => {
      return arrayToHTMLCollection([
        createSubtitleElement(subtitle1 as Subtitle),
        createSubtitleElement(subtitle2 as Subtitle)
      ]);
    },
    fullscreenElement: fullscreenElement
  };

  const document = container as Document;

  DIC.setDocument(document);

  fullscreenChangeHandler();

  expect(subtitle1.setIsFullscreenActive).toHaveBeenCalledWith(false);
  expect(subtitle2.setIsFullscreenActive).toHaveBeenCalledWith(true);
});

test('isInitialized returns the correct value', () => {
  const getDocument = (element: HTMLElement): Document => {
    const document = {
      getElementById: (): HTMLElement => {
        return element;
      }
    } as Partial<Document>;

    return document as Document;
  };

  expect(isInitialized(getDocument(null))).toBe(false);
  expect(isInitialized(getDocument({} as HTMLElement))).toBe(true);
});

const getDocument = (element: HTMLElement, insertHandler: Function, addEventListenerHandler: Function, createElement: HTMLElement): Document => {
  const document = {
    getElementById: (): HTMLElement => {
      return element;
    },
    getElementsByTagName: (): HTMLCollectionOf<any> => {
      const headElement = {
        insertBefore: insertHandler
      };

      return arrayToHTMLCollection([ headElement ]);
    },
    createElement: (): HTMLElement => {
      return createElement;
    },
    addEventListener: addEventListenerHandler as any
  } as Partial<Document>;

  return document as Document;
};

test('initialize initializes the library', () => {
  const styleElement = {} as HTMLElement;
  const insertHandler = jest.fn();
  const addEventListenerHandler = jest.fn();

  const document = getDocument(null, insertHandler, addEventListenerHandler, styleElement);

  DIC.setDocument(document);

  initialize();

  expect(insertHandler).toHaveBeenCalledWith(styleElement, undefined);
  expect(addEventListenerHandler).toHaveBeenCalledWith('fullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('webkitfullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('mozfullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('MSFullscreenChange', fullscreenChangeHandler);
});

test('initialize initializes the library only once', () => {
  const styleElement = {} as HTMLElement;
  const insertHandler = jest.fn();
  const addEventListenerHandler = jest.fn();

  const document = getDocument({} as HTMLElement, insertHandler, addEventListenerHandler, styleElement);

  DIC.setDocument(document);

  initialize();

  expect(insertHandler).not.toHaveBeenCalled();
  expect(addEventListenerHandler).not.toHaveBeenCalled();
});

test('addQueryStringParameterToUrl returns the correct url', () => {
  expect(addQueryStringParameterToUrl('http://example.com/', {})).toBe('http://example.com/');
  expect(addQueryStringParameterToUrl('http://example.com/', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=fakeValue');
  expect(addQueryStringParameterToUrl('http://example.com/?fakeParameter=prevValue', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=prevValue&fakeParameter=fakeValue');
  expect(addQueryStringParameterToUrl('http://example.com/#hashPart', { fakeParameter: 'fakeValue' })).toBe('http://example.com/?fakeParameter=fakeValue#hashPart');
});
