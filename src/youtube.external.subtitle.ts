import Subtitle from './subtitle';
import DIC from './dic';

declare global {
  interface Window {
    YT: any;
  }
}

const iframeApiScriptAdded = (): boolean => {
  const document = DIC.getDocument();

  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;

    if (src && src.indexOf('youtube.com/iframe_api') !== -1) {
      return true;
    }
  }

  return false;
};

const addIframeApiScript = (): void => {
  const document = DIC.getDocument();

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

const iframeApiLoaded = () => {
  return !!(window.YT && window.YT.Player);
};

const onIframeApiReady = (cb: Function): void => {
  if (DIC.getYT() !== null) {
    cb();

    return;
  }

  const onLoaded = () => {
    DIC.setYT(window.YT);

    cb();
  };

  if (iframeApiLoaded()) {
    onLoaded();

    return;
  }

  const iframeApiInterval = setInterval(() => {
    if (iframeApiLoaded()) {
      clearInterval(iframeApiInterval);

      onLoaded();
    }
  }, 100);

  if (!iframeApiScriptAdded()) {
    addIframeApiScript();
  }
};

DIC.setDocument(window.document);
DIC.setOnIframeApiReady(onIframeApiReady);

export default { Subtitle };
