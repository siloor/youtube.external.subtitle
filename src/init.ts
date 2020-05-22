import DIC from './dic';

export const iframeApiScriptAdded = (document: Document): boolean => {
  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;

    if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
      return true;
    }
  }

  return false;
};

export const addIframeApiScript = (document: Document): void => {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

export const iframeApiLoaded = (window: Window) => {
  return !!(window.YT && window.YT.Player);
};

export const onIframeApiReady = (cb: Function): void => {
  const window = DIC.getWindow();
  const document = DIC.getDocument();

  if (DIC.getYT() !== null) {
    cb();

    return;
  }

  const onLoaded = () => {
    DIC.setYT(window.YT);

    cb();
  };

  if (iframeApiLoaded(window)) {
    onLoaded();

    return;
  }

  const iframeApiInterval = setInterval(() => {
    if (iframeApiLoaded(window)) {
      clearInterval(iframeApiInterval);

      onLoaded();
    }
  }, 100);

  if (!iframeApiScriptAdded(document)) {
    addIframeApiScript(document);
  }
};

const init = (window: Window) => {
  DIC.setWindow(window);
  DIC.setDocument(window.document);
  DIC.setOnIframeApiReady(onIframeApiReady);
};

export default init;
