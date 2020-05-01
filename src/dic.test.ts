import { Container, Youtube } from './dic';

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
