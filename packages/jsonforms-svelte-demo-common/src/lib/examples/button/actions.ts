import type { DemoActionEvent, DemoActionHandler } from '../actions';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getRequestedLocale = (params: Record<string, unknown>): string | undefined => {
  if (typeof params.lang === 'string') {
    return params.lang;
  }

  return typeof params.locale === 'string' ? params.locale : undefined;
};

const getStringParam = (params: Record<string, unknown>, key: string): string | undefined => {
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
};

const getLocalizedMessage = (
  messages: unknown,
  locale: string | undefined,
  fallback: string,
): string => {
  if (typeof messages !== 'object' || messages === null) {
    return fallback;
  }

  const localizedMessages = messages as Record<string, unknown>;
  const exact = locale ? localizedMessages[locale] : undefined;
  if (typeof exact === 'string') {
    return exact;
  }

  const baseLocale = locale?.split('-')[0];
  const base = baseLocale ? localizedMessages[baseLocale] : undefined;
  if (typeof base === 'string') {
    return base;
  }

  const english = localizedMessages.en;
  return typeof english === 'string' ? english : fallback;
};

const getLocalizedParam = (
  params: Record<string, unknown>,
  key: string,
  locale: string | undefined,
  fallback: string,
): string => {
  const direct = getStringParam(params, key);
  if (direct) {
    return direct;
  }

  return getLocalizedMessage(params[`${key}ByLocale`], locale, fallback);
};

function showDialog(message: string) {
  const dialog = document.createElement('dialog');

  dialog.style.padding = '20px';
  dialog.style.border = 'none';
  dialog.style.borderRadius = '12px';
  dialog.style.width = '350px';
  dialog.style.maxWidth = '90%';
  dialog.style.minHeight = '150px';
  dialog.style.textAlign = 'center';
  dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  dialog.style.fontFamily = 'Arial, sans-serif';
  dialog.style.backgroundColor = '#fff';
  dialog.style.overflow = 'hidden';
  dialog.style.margin = '0 auto';

  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.fontSize = '16px';
  messageElement.style.fontWeight = 'normal';
  messageElement.style.color = '#333';
  messageElement.style.marginBottom = '20px';
  dialog.appendChild(messageElement);

  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'OK';
  confirmButton.style.padding = '10px 20px';
  confirmButton.style.fontSize = '16px';
  confirmButton.style.backgroundColor = '#007bff';
  confirmButton.style.color = '#fff';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '6px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.display = 'none';
  confirmButton.style.marginTop = '20px';

  confirmButton.addEventListener('mouseover', () => {
    confirmButton.style.backgroundColor = '#0056b3';
  });
  confirmButton.addEventListener('mouseout', () => {
    confirmButton.style.backgroundColor = '#007bff';
  });
  confirmButton.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.appendChild(confirmButton);
  dialog.appendChild(buttonContainer);

  document.body.appendChild(dialog);
  dialog.showModal();

  return { messageElement, confirmButton };
}

function completeDialog(
  dialogMessage: HTMLParagraphElement,
  confirmButton: HTMLButtonElement,
  message: string,
) {
  dialogMessage.textContent = message;
  confirmButton.style.display = 'block';
}

const applyStatus: DemoActionHandler = (event) => {
  const currentData = isObjectRecord(event.context.data) ? event.context.data : {};
  const status = getLocalizedMessage(
    event.params.statusByLocale,
    event.context.locale,
    'Updated from action callback',
  );

  event.context.data = {
    ...currentData,
    status,
    lastTriggeredBy: event.action,
  };
};

const changeLang: DemoActionHandler = (event) => {
  const nextLocale = getRequestedLocale(event.params);
  if (!nextLocale) {
    return;
  }

  const appStore = isObjectRecord(event.context.appStore) ? event.context.appStore : undefined;
  const jsonforms = appStore && isObjectRecord(appStore.jsonforms) ? appStore.jsonforms : undefined;
  const localeStore = jsonforms && isObjectRecord(jsonforms.locale) ? jsonforms.locale : undefined;

  if (localeStore && 'value' in localeStore) {
    (localeStore as { value: unknown }).value = nextLocale;
    return;
  }

  if (jsonforms) {
    jsonforms.locale = nextLocale;
    return;
  }

  const rootNode = event.$el.getRootNode();
  if (rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement) {
    rootNode.host.setAttribute('locale', nextLocale);
  }
};

const simulateHttpSubmit: DemoActionHandler = async (event) => {
  const submittingMessage = getLocalizedParam(
    event.params,
    'submittingMessage',
    event.context.locale,
    'Please wait, action in progress...',
  );
  const submittedMessage = getLocalizedParam(
    event.params,
    'submittedMessage',
    event.context.locale,
    'Action complete! Click OK to continue. Check your javascript console for the JSON data from your form.',
  );
  const { messageElement, confirmButton } = showDialog(submittingMessage);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(
    event.context.data ? JSON.stringify(event.context.data) : 'Your form is blank. No JSON data.',
  );

  event.context.data = {};

  completeDialog(messageElement, confirmButton, submittedMessage);
};

const actionHandlers: Record<string, DemoActionHandler> = {
  applyStatus,
  changeLang,
  simulateHttpSubmit,
};

export const onHandleAction = (event: DemoActionEvent) => {
  const handler = actionHandlers[event.action];

  if (handler) {
    event.callback = handler;
  }
};
