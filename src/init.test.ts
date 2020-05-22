import DIC from './dic';
import init, {
  iframeApiScriptAdded,
  addIframeApiScript,
  grantIframeApiScript,
  iframeApiLoaded,
  onIframeApiReady
} from './init';

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

test('init sets the correct DIC properties', () => {
  const document = {} as Document;
  const window = {
    document: document
  } as Window;

  init(window);

  expect(DIC.getWindow()).toBe(window);
  expect(DIC.getDocument()).toBe(document);
  expect(DIC.getOnIframeApiReady()).toBe(onIframeApiReady);
});
