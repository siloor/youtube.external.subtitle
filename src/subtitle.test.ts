import Subtitle, {
  SubtitleElement,
  SubtitleFrame,
  State,
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
  addQueryStringParameterToUrl,
  getIframeSrc,
  createSubtitleElement,
  isStateChanged
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

  expect(getFullscreenElement(
    getDocument(undefined, undefined, undefined, undefined, undefined)
  )).toBe(undefined);
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

const createMockSubtitleElement = (subtitle: Subtitle): SubtitleElement => {
  return { youtubeExternalSubtitle: subtitle } as SubtitleElement;
};

test('getSubtitles returns the correct subtitles', () => {
  expect(getSubtitles(createContainerMock([]))).toStrictEqual([]);

  const subtitle1 = {};
  const subtitle2 = {};

  expect(getSubtitles(createContainerMock([
    createMockSubtitleElement(subtitle1 as Subtitle),
    createMockSubtitleElement(subtitle2 as Subtitle)
  ]))).arrayItemsToBe([ subtitle1, subtitle2 ]);
});

test('getFullscreenSubtitle returns the correct subtitle', () => {
  const subtitle1 = {};
  const subtitle2 = {};

  expect(getFullscreenSubtitle(undefined)).toBe(null);
  expect(getFullscreenSubtitle(createMockSubtitleElement(subtitle1 as Subtitle))).toBe(subtitle1);
  expect(getFullscreenSubtitle(createContainerMock([
    createMockSubtitleElement(subtitle2 as Subtitle),
    createMockSubtitleElement(subtitle1 as Subtitle)
  ]) as SubtitleElement)).toBe(subtitle2);
  expect(getFullscreenSubtitle(createContainerMock([]) as SubtitleElement)).toBe(null);
});

test('fullscreenChangeHandler sets subtitles state correctly', () => {
  const getDocument = (fullscreenSubtitle: Partial<Subtitle>, subtitles: Partial<Subtitle>[]): Partial<Document> => {
    return {
      getElementsByClassName: (classNames: string): HTMLCollectionOf<Element> => {
        return arrayToHTMLCollection(subtitles.map(subtitle => createMockSubtitleElement(subtitle as Subtitle)));
      },
      fullscreenElement: fullscreenSubtitle ? createMockSubtitleElement(fullscreenSubtitle as Subtitle) : undefined
    };
  };

  const subtitle1 = { setIsFullscreenActive: jest.fn() };
  const subtitle2 = { setIsFullscreenActive: jest.fn() };

  DIC.setDocument(getDocument(subtitle2, [subtitle1, subtitle2]) as Document);

  fullscreenChangeHandler();

  expect(subtitle1.setIsFullscreenActive).toHaveBeenCalledWith(false);
  expect(subtitle2.setIsFullscreenActive).toHaveBeenCalledWith(true);

  const subtitle3 = { setIsFullscreenActive: jest.fn() };
  const subtitle4 = { setIsFullscreenActive: jest.fn() };

  DIC.setDocument(getDocument(undefined, [subtitle3, subtitle4]) as Document);

  fullscreenChangeHandler();

  expect(subtitle3.setIsFullscreenActive).toHaveBeenCalledWith(null);
  expect(subtitle4.setIsFullscreenActive).toHaveBeenCalledWith(null);
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

test('initialize initializes the library', () => {
  const getDocument = (element: HTMLElement, insertHandler: Function, addEventListenerHandler: Function, createElement: HTMLElement, hasHeadElement: boolean): Document => {
    const document = {
      getElementById: (): HTMLElement => {
        return element;
      },
      getElementsByTagName: (): HTMLCollectionOf<any> => {
        if (!hasHeadElement) {
          return arrayToHTMLCollection([]);
        }

        const headElement = {
          insertBefore: insertHandler
        };

        return arrayToHTMLCollection([ headElement ]);
      },
      createElement: (): HTMLElement => {
        return createElement;
      },
      addEventListener: addEventListenerHandler as any,
      documentElement: {
        insertBefore: insertHandler
      } as HTMLElement
    } as Partial<Document>;

    return document as Document;
  };

  const testInitialize = (alreadyInitialized: boolean, hasHeadElement: boolean) => {
    const element = alreadyInitialized ? {} as HTMLElement : null;
    const styleElement = {} as HTMLElement;
    const insertHandler = jest.fn();
    const addEventListenerHandler = jest.fn();

    const document = getDocument(element, insertHandler, addEventListenerHandler, styleElement, hasHeadElement);

    DIC.setDocument(document);

    initialize();

    if (alreadyInitialized) {
      expect(insertHandler).not.toHaveBeenCalled();
      expect(addEventListenerHandler).not.toHaveBeenCalled();
    } else {
      expect(insertHandler).toHaveBeenCalledWith(styleElement, undefined);
      expect(addEventListenerHandler).toHaveBeenCalledWith('fullscreenchange', fullscreenChangeHandler);
      expect(addEventListenerHandler).toHaveBeenCalledWith('webkitfullscreenchange', fullscreenChangeHandler);
      expect(addEventListenerHandler).toHaveBeenCalledWith('mozfullscreenchange', fullscreenChangeHandler);
      expect(addEventListenerHandler).toHaveBeenCalledWith('MSFullscreenChange', fullscreenChangeHandler);
    }
  };

  testInitialize(false, true);
  testInitialize(false, false);
  testInitialize(true, true);
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
