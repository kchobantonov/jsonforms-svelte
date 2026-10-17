import { untrack } from 'svelte';
import {
  useJsonForms,
  useJsonFormsControl,
  type ControlProps,
} from '@chobantonov/jsonforms-svelte';
import {
  CRON_FIELDS,
  NOTHING_CHOSEN,
  cronProblem,
  fieldsForPeriod,
  joinCron,
  periodOf,
  sameExpression,
  splitCron,
  standDown,
  withTimeDefaults,
  type CronField,
  type CronPeriod,
} from './cron';

export const CRON_PERIODS: CronPeriod[] = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

/** Picker drafts never replace host updates or contribute duplicate schema errors. */
export function useCron(props: ControlProps) {
  const binding = useJsonFormsControl(props);
  const form = useJsonForms();
  const expression = $derived(
    typeof binding.control.data === 'string'
      ? binding.control.data
      : (JSON.stringify(binding.control.data) ?? ''),
  );
  const options = $derived({ ...binding.control.config, ...props.uischema.options });
  const disabled = $derived(!binding.control.enabled || binding.control.readonly === true);
  const showActions = $derived(options.showActions !== false);
  let open = $state(false);
  let text = $state('');
  let period = $state<CronPeriod | undefined>();
  let touched = $state(false);
  let openedPath = '';
  let openedValue: unknown;
  let openedSchema: unknown;
  const fields = $derived(splitCron(text) ?? [...NOTHING_CHOSEN]);
  const shownFields = $derived(period ? fieldsForPeriod(period) : []);
  const editedProblem = $derived(text.trim() === '' ? undefined : cronProblem(text));
  const problem = $derived(
    form.core?.validationMode === 'NoValidation' ||
      form.core?.validationMode === 'ValidateAndHide' ||
      expression.trim() === ''
      ? undefined
      : cronProblem(expression),
  );
  $effect(() => {
    const current = binding.control.data;
    const path = binding.control.path;
    const schema = binding.control.schema;
    if (
      open &&
      (disabled ||
        path !== openedPath ||
        schema !== openedSchema ||
        !Object.is(current, openedValue))
    ) {
      untrack(() => setOpen(false));
    }
  });
  function setOpen(next: boolean) {
    if (next === open || (next && disabled)) return;
    if (next) {
      text = expression;
      const parsed = splitCron(expression);
      period = parsed ? periodOf(parsed) : undefined;
      touched = false;
      openedPath = binding.control.path;
      openedValue = binding.control.data;
      openedSchema = binding.control.schema;
    }
    open = next;
  }
  function commit(next: string) {
    if (disabled || (typeof binding.control.data === 'string' && sameExpression(next, expression)))
      return;
    openedValue = next === '' ? undefined : next;
    binding.handleChange(binding.control.path, openedValue);
  }
  function change(next: string) {
    if (disabled) return;
    text = next;
    touched = true;
    if (!showActions) commit(next);
  }
  function changeText(next: string) {
    const parsed = splitCron(next);
    if (parsed) period = periodOf(parsed);
    change(next);
  }
  function changeField(field: CronField, value: string) {
    const next = [...fields];
    const chosen = value.trim() !== '' && value !== '*';
    next[CRON_FIELDS.indexOf(field)] = chosen ? value : '*';
    change(joinCron(chosen ? withTimeDefaults(next, field) : next));
  }
  function changePeriod(next: CronPeriod) {
    if (disabled || next === period) return;
    period = next;
    if (next === 'second') change(joinCron(NOTHING_CHOSEN));
    else if (splitCron(text)) change(joinCron(standDown(fields, next)));
  }
  function apply() {
    if (disabled || editedProblem) return;
    if (touched) commit(text);
    setOpen(false);
  }
  return {
    binding,
    setOpen,
    changeText,
    changeField,
    changePeriod,
    apply,
    input: (next: string) => {
      if (!disabled) binding.handleChange(binding.control.path, next === '' ? undefined : next);
    },
    get open() {
      return open;
    },
    get text() {
      return text;
    },
    get expression() {
      return expression;
    },
    get period() {
      return period;
    },
    get fields() {
      return fields;
    },
    get shownFields() {
      return shownFields;
    },
    get disabled() {
      return disabled;
    },
    get showActions() {
      return showActions;
    },
    get problem() {
      return problem;
    },
    get editedProblem() {
      return editedProblem;
    },
    get options() {
      return options;
    },
  };
}
