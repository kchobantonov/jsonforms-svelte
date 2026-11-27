import { changeLang, type DemoActionEvent } from '../actions';

export const onHandleAction = (event: DemoActionEvent) => {
  if (event.action === 'changeLang') {
    event.callback = changeLang;
  }
};
