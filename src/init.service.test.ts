import DIC, { Youtube } from './dic';
import Subtitle, { SubtitleElement } from './subtitle';
import InitService, {
  iframeApiScriptAdded,
  addIframeApiScript,
  grantIframeApiScript,
  iframeApiLoaded,
  waitFor,
  fullscreenChangeHandler,
  getFullscreenElement,
  getFullscreenSubtitle,
  getSubtitles,
  globalStylesAdded,
  addGlobalStyles,
  init
} from './init.service';

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

const arrayToHTMLCollection = (array: any): HTMLCollectionOf<Element> => {
  return array as HTMLCollectionOf<Element>;
};

test('iframeApiScriptAdded returns the correct result', () => {
  const getDocument = (addIframeApi: boolean): Partial<Document> => {
    return {
      getElementsByTagName: (): HTMLCollectionOf<any> => {
        const scripts = [
          { src: 'https://www.youtube.com/fake_script_file.js' }
        ];

        if (addIframeApi) {
          scripts.push({ src: 'https://www.youtube.com/iframe_api' });
        }

        return arrayToHTMLCollection(scripts);
      }
    };
  };

  expect(iframeApiScriptAdded(getDocument(false) as Document)).toBe(false);

  expect(iframeApiScriptAdded(getDocument(true) as Document)).toBe(true);
});

test('addIframeApiScript adds the iframe api script', () => {
  const insertHandler = jest.fn();
  const element = {} as HTMLElement;
  const firstScript = {
    parentNode: {
      insertBefore: insertHandler
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document = {
    getElementsByTagName: (): HTMLCollectionOf<any> => {
      return arrayToHTMLCollection([ firstScript ]);
    },
    createElement: (): HTMLElement => {
      return element;
    }
  } as Partial<Document>;

  addIframeApiScript(document as Document);

  expect(insertHandler).toHaveBeenCalledWith(element, firstScript);
});

test('grantIframeApiScript adds the iframe api script if needed', () => {
  const getDocument = (firstScript: HTMLScriptElement, element: HTMLElement, addIframeApi: boolean): Partial<Document> => {
    return {
      getElementsByTagName: (): HTMLCollectionOf<any> => {
        const result = [ firstScript ];

        if (addIframeApi) {
          const iframeApiScript = {
            src: 'https://www.youtube.com/iframe_api'
          } as Partial<HTMLScriptElement>;

          result.push(iframeApiScript as HTMLScriptElement);
        }

        return arrayToHTMLCollection(result);
      },
      createElement: (): HTMLElement => {
        return element;
      }
    };
  };

  const element = {};
  const firstScript = {
    parentNode: {
      insertBefore: jest.fn()
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document = getDocument(firstScript as HTMLScriptElement, element as HTMLElement, false);

  grantIframeApiScript(document as Document);

  expect(firstScript.parentNode.insertBefore).toHaveBeenCalledWith(element, firstScript);

  const element2 = {};
  const firstScript2 = {
    parentNode: {
      insertBefore: jest.fn()
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document2 = getDocument(firstScript2 as HTMLScriptElement, element2 as HTMLElement, true);

  grantIframeApiScript(document2 as Document);

  expect(firstScript2.parentNode.insertBefore).not.toHaveBeenCalled();
});

test('iframeApiLoaded returns the correct result', () => {
  expect(iframeApiLoaded({} as Window)).toBe(false);

  expect(iframeApiLoaded({
    YT: {}
  } as Window)).toBe(false);

  expect(iframeApiLoaded({
    YT: { Player: {} }
  } as Window)).toBe(true);
});

jest.useFakeTimers();

test('waitFor calls the onComplete when isReady is true', () => {
  const onComplete = jest.fn();

  waitFor(() => { return true; }, onComplete);

  expect(onComplete).toHaveBeenCalled();

  const onComplete2 = jest.fn();
  let counter = 0;

  waitFor(() => {
    return counter++ > 9;
  }, onComplete2);

  expect(onComplete2).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1000);

  expect(onComplete2).toHaveBeenCalled();
});

test('getSubtitles return the correct subtitles', () => {
  const initService = new InitService();

  const fakeSubtitles = [
    {} as Subtitle
  ];

  initService['subtitles'] = fakeSubtitles;

  expect(initService.getSubtitles()).toBe(fakeSubtitles);
});

test('addSubtitle adds the subtitle correctly', () => {
  const initService = new InitService();

  const fakeSubtitle = {};

  initService.addSubtitle(fakeSubtitle as Subtitle);

  expect(initService.getSubtitles()).arrayItemsToBe([ fakeSubtitle ]);
});

test('removeSubtitle removes the subtitle correctly', () => {
  const initService = new InitService();

  const fakeSubtitle1 = {};
  const fakeSubtitle2 = {};

  initService['subtitles'] = [
    fakeSubtitle1 as Subtitle,
    fakeSubtitle2 as Subtitle
  ];

  expect(initService.getSubtitles()).arrayItemsToBe([ fakeSubtitle1, fakeSubtitle2 ]);

  initService.removeSubtitle(fakeSubtitle1 as Subtitle);

  expect(initService.getSubtitles()).arrayItemsToBe([ fakeSubtitle2 ]);

  initService.removeSubtitle(fakeSubtitle1 as Subtitle);

  expect(initService.getSubtitles()).arrayItemsToBe([ fakeSubtitle2 ]);
});

test('grantIframeApi calls the callback when the Youtube Api is available', () => {
  const callback1 = jest.fn();
  const YT1 = {};

  DIC.setYT(YT1 as Youtube);

  const initService = new InitService();

  initService.grantIframeApi(callback1);

  expect(callback1).toHaveBeenCalled();
  expect(DIC.getYT()).toBe(YT1);

  DIC.setYT(null);

  const YT2 = { Player: {} };
  const document = {
    getElementsByTagName: (): HTMLCollectionOf<any> => {
      return arrayToHTMLCollection([
        { src: 'https://www.youtube.com/iframe_api' }
      ]);
    }
  } as Partial<Document>;
  const window = {
    YT: YT2
  } as Partial<Window>;

  DIC.setWindow(window as Window);
  DIC.setDocument(document as Document);

  const callback2 = jest.fn();

  initService.grantIframeApi(callback2);

  expect(callback2).toHaveBeenCalled();
  expect(DIC.getYT()).toBe(YT2);
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

const createMockSubtitleElement = (subtitle: Subtitle): SubtitleElement => {
  return { youtubeExternalSubtitle: subtitle } as SubtitleElement;
};

test('getSubtitles returns the correct subtitles', () => {
  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [];
    }
  } as InitService);

  expect(getSubtitles({} as Element)).toStrictEqual([]);

  const subtitle1 = {
    isInContainer: () => false
  } as Partial<Subtitle>;
  const subtitle2 = {
    isInContainer: () => true
  } as Partial<Subtitle>;

  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [
        subtitle1 as Subtitle,
        subtitle2 as Subtitle
      ];
    }
  } as InitService);

  expect(getSubtitles({} as Element)).arrayItemsToBe([ subtitle2 ]);
});

test('getFullscreenSubtitle returns the correct subtitle', () => {
  expect(getFullscreenSubtitle(undefined)).toBe(null);

  const subtitle1 = {
    isInContainer: () => true
  } as Partial<Subtitle>;

  expect(getFullscreenSubtitle(createMockSubtitleElement(subtitle1 as Subtitle))).toBe(subtitle1);

  const subtitle2 = {
    isInContainer: () => true
  } as Partial<Subtitle>;

  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [
        subtitle1 as Subtitle,
        subtitle2 as Subtitle
      ];
    }
  } as InitService);

  expect(getFullscreenSubtitle({} as SubtitleElement)).toBe(subtitle1);

  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [];
    }
  } as InitService);

  expect(getFullscreenSubtitle({} as SubtitleElement)).toBe(null);
});

test('fullscreenChangeHandler sets subtitles state correctly', () => {
  const getDocument = (fullscreenSubtitle: Partial<Subtitle>): Partial<Document> => {
    return {
      fullscreenElement: fullscreenSubtitle ? createMockSubtitleElement(fullscreenSubtitle as Subtitle) : undefined
    };
  };

  const subtitle1 = {
    setIsFullscreenActive: jest.fn(),
    isInContainer: () => true
  } as Partial<Subtitle>;
  const subtitle2 = {
    setIsFullscreenActive: jest.fn(),
    isInContainer: () => true
  } as Partial<Subtitle>;

  DIC.setDocument(getDocument(subtitle2) as Document);
  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [
        subtitle1 as Subtitle,
        subtitle2 as Subtitle
      ];
    }
  } as InitService);

  fullscreenChangeHandler();

  expect(subtitle1.setIsFullscreenActive).toHaveBeenCalledWith(false);
  expect(subtitle2.setIsFullscreenActive).toHaveBeenCalledWith(true);

  const subtitle3 = {
    setIsFullscreenActive: jest.fn(),
    isInContainer: () => true
  } as Partial<Subtitle>;
  const subtitle4 = {
    setIsFullscreenActive: jest.fn(),
    isInContainer: () => true
  } as Partial<Subtitle>;

  DIC.setDocument(getDocument(undefined) as Document);
  DIC.setInitService({
    getSubtitles(): Subtitle[] {
      return [
        subtitle3 as Subtitle,
        subtitle4 as Subtitle
      ];
    }
  } as InitService);

  fullscreenChangeHandler();

  expect(subtitle3.setIsFullscreenActive).toHaveBeenCalledWith(null);
  expect(subtitle4.setIsFullscreenActive).toHaveBeenCalledWith(null);
});

test('globalStylesAdded returns the correct value', () => {
  const getDocument = (element: HTMLElement): Document => {
    const document = {
      getElementById: (): HTMLElement => {
        return element;
      }
    } as Partial<Document>;

    return document as Document;
  };

  expect(globalStylesAdded(getDocument(null))).toBe(false);
  expect(globalStylesAdded(getDocument({} as HTMLElement))).toBe(true);
});

const getGlobalStylesDocument = (element: HTMLElement, insertHandler: Function, addEventListenerHandler: Function, createElement: HTMLElement, hasHeadElement: boolean): Document => {
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

const testGlobalStylesAdded = (insertHandler: Function, styleElement: HTMLElement, addEventListenerHandler: Function) => {
  expect(insertHandler).toHaveBeenCalledWith(styleElement, undefined);
  expect(addEventListenerHandler).toHaveBeenCalledWith('fullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('webkitfullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('mozfullscreenchange', fullscreenChangeHandler);
  expect(addEventListenerHandler).toHaveBeenCalledWith('MSFullscreenChange', fullscreenChangeHandler);
};

test('addGlobalStyles adds global styles', () => {
  const testGlobalStyles = (hasHeadElement: boolean) => {
    const styleElement = {} as HTMLElement;
    const insertHandler = jest.fn();
    const addEventListenerHandler = jest.fn();

    addGlobalStyles(getGlobalStylesDocument(null, insertHandler, addEventListenerHandler, styleElement, hasHeadElement));

    testGlobalStylesAdded(insertHandler, styleElement, addEventListenerHandler);
  };

  testGlobalStyles(true);
  testGlobalStyles(false);
});

test('grantGlobalStyles adds global styles', () => {
  const testGlobalStyles = (alreadyAdded: boolean, hasHeadElement: boolean) => {
    const element = alreadyAdded ? {} as HTMLElement : null;
    const styleElement = {} as HTMLElement;
    const insertHandler = jest.fn();
    const addEventListenerHandler = jest.fn();

    const document = getGlobalStylesDocument(element, insertHandler, addEventListenerHandler, styleElement, hasHeadElement);

    DIC.setDocument(document);

    const initService = new InitService();

    initService.grantGlobalStyles();

    if (alreadyAdded) {
      expect(insertHandler).not.toHaveBeenCalled();
      expect(addEventListenerHandler).not.toHaveBeenCalled();
    } else {
      testGlobalStylesAdded(insertHandler, styleElement, addEventListenerHandler);
    }
  };

  testGlobalStyles(false, true);
  testGlobalStyles(false, false);
  testGlobalStyles(true, true);
});

test('init sets the correct DIC properties', () => {
  const document = {} as Document;
  const window = {
    document: document
  } as Window;

  init(window);

  expect(DIC.getWindow()).toBe(window);
  expect(DIC.getDocument()).toBe(document);
  expect(DIC.getInitService().constructor).toBe(InitService);
});
