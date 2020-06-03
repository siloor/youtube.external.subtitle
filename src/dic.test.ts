import { Container, Youtube } from './dic';
import InitService from './init.service';

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

test('getInitService returns the correct InitService', () => {
  const container = new Container();

  expect(container.getInitService()).toBe(null);

  const initService = {} as InitService;

  container.setInitService(initService);

  expect(container.getInitService()).toBe(initService);
});
