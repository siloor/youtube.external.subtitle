import { Container, Youtube } from './dic';

test('getWindow returns the correct window', () => {
  const container = new Container();

  expect(container.getWindow()).toBe(null);

  const window = {} as Window;

  container.setWindow(window);

  expect(container.getWindow()).toBe(window);
});

test('getDocument returns the correct document', () => {
  const container = new Container();

  expect(container.getDocument()).toBe(null);

  const document = {} as Document;

  container.setDocument(document);

  expect(container.getDocument()).toBe(document);
});

test('getYT returns the correct youtube object', () => {
  const container = new Container();

  expect(container.getYT()).toBe(null);

  const YT = {} as Youtube;

  container.setYT(YT);

  expect(container.getYT()).toBe(YT);
});

test('getOnIframeApiReady returns the correct onIframeApiReady function', () => {
  const container = new Container();

  expect(container.getOnIframeApiReady()).toBe(null);

  const onIframeApiReady = () => {};

  container.setOnIframeApiReady(onIframeApiReady);

  expect(container.getOnIframeApiReady()).toBe(onIframeApiReady);
});
