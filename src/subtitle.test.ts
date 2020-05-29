import DIC from './dic';
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
