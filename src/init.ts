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

export const grantIframeApiScript = (document: Document): void => {
  if (!iframeApiScriptAdded(document)) {
    addIframeApiScript(document);
  }
};

export const iframeApiLoaded = (window: Window): boolean => {
  return !!(window.YT && window.YT.Player);
};

export const waitFor = (isReady: Function, onComplete: Function): void => {
  if (isReady()) {
    onComplete();

    return;
  }

  const interval = setInterval(() => {
    if (isReady()) {
      clearInterval(interval);

      onComplete();
    }
  }, 100);
};

export const onIframeApiReady = (cb: Function): void => {
  if (DIC.getYT() !== null) {
    cb();

    return;
  }

  const window = DIC.getWindow();
  const document = DIC.getDocument();

  waitFor(
    () => {
      return iframeApiLoaded(window);
    },
    () => {
      DIC.setYT(window.YT);

      cb();
    }
  );

  grantIframeApiScript(document);
};

const init = (window: Window) => {
  DIC.setWindow(window);
  DIC.setDocument(window.document);
  DIC.setOnIframeApiReady(onIframeApiReady);
};

export default init;
