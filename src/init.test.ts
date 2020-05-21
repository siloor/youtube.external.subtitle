import DIC from './dic';
import { iframeApiScriptAdded } from './init';

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

  DIC.setDocument(getDocument(false) as Document);

  expect(iframeApiScriptAdded()).toBe(false);

  DIC.setDocument(getDocument(true) as Document);

  expect(iframeApiScriptAdded()).toBe(true);
});
