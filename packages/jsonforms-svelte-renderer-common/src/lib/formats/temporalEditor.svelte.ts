import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
import { useAuthoredConfig } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { useTemporalDataBounds } from '../objects/literalDataContext';
import type { MaskaDetail, MaskInputOptions } from 'maska';
import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { registerDetailDialogChange } from '../interaction/detailDialog.svelte';
import { useUIDiagnosticReporter } from '../validation/authorDiagnostic.svelte';
import {
  convertDayjsToMaskaFormat,
  expandLocaleFormat,
  formatTemporalProbe,
  parseTemporalText,
  parseDateTime,
  resolveTemporalBounds,
  temporalValueWithinBounds,
  resolvePickerDateTimeCandidate,
} from './datejs';
import {
  temporalDateMode,
  temporalRestrict,
  temporalTimeColumns,
  warnTemporalSaveFormat,
} from './temporalOptions';

const formatsByKind = {
  date: { locale: 'L', display: 'YYYY-MM-DD', save: 'YYYY-MM-DD', schema: ['YYYY-MM-DD'] },
  dateTime: {
    locale: 'L LT',
    display: 'YYYY-MM-DD HH:mm',
    save: 'YYYY-MM-DDTHH:mm:ssZ',
    schema: [
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'YYYY-MM-DDTHH:mm:ss.SSS',
      'YYYY-MM-DDTHH:mm:ssZ',
      'YYYY-MM-DDTHH:mm:ss',
    ],
  },
  time: {
    locale: 'LT',
    display: 'H:mm',
    save: 'HH:mm:ssZ',
    schema: ['HH:mm:ss.SSSZ', 'HH:mm:ss.SSS', 'HH:mm:ssZ', 'HH:mm:ss'],
  },
};

export function useTemporalEditor(
  kind: keyof typeof formatsByKind,
  binding: {
    control: ReturnType<typeof useJsonFormsControl>['control'];
    appliedOptions: Record<string, unknown>;
    onChange: (value: string | null | undefined) => void;
  },
  adaptValue: (value: string | null | undefined) => unknown,
  localOptions: () => Record<string, unknown> | undefined,
) {
  const defaults = formatsByKind[kind];
  const displayFormat = $derived.by(() => {
    const format = binding.appliedOptions[kind + 'Format'];
    return typeof format === 'string'
      ? (expandLocaleFormat(format) ?? format)
      : (expandLocaleFormat(defaults.locale) ?? defaults.display);
  });
  const saveFormat = $derived.by(() => {
    const format = binding.appliedOptions[kind + 'SaveFormat'];
    return typeof format === 'string' ? format : defaults.save;
  });
  const formats = $derived([saveFormat, displayFormat, ...defaults.schema]);
  // Diagnostic history must not subscribe the reporting effect to its own writes.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const reportedSaveFormats = new Set<string>();
  const reportDiagnostic = useUIDiagnosticReporter();
  $effect(() => {
    warnTemporalSaveFormat(
      binding.control.schema.format,
      saveFormat,
      formatTemporalProbe(saveFormat),
      binding.control.path,
      reportedSaveFormats,
      reportDiagnostic,
    );
  });
  let maskState = $state<MaskaDetail>({ masked: '', unmasked: '', completed: false });
  let textDraft = $state<string | undefined>();
  // A partial temporal value exists only in this input; collection actions
  // must wait until it is completed or discarded instead of using stale data.
  registerDetailDialogChange({
    isBlocked: () => textDraft !== undefined,
    cancel: () => {
      textDraft = undefined;
    },
  });
  let observedData = binding.control.data;
  let observedPath = binding.control.path;
  let observedSchema = binding.control.schema;
  $effect(() => {
    const data = binding.control.data;
    const path = binding.control.path;
    const schema = binding.control.schema;
    if (
      data !== observedData ||
      path !== observedPath ||
      schema !== observedSchema ||
      !binding.control.enabled ||
      binding.control.readonly
    ) {
      observedData = data;
      observedPath = path;
      observedSchema = schema;
      textDraft = undefined;
    }
  });
  const useMask = $derived(binding.appliedOptions.mask !== false);

  const maskOptions = $derived.by<MaskInputOptions | undefined>(() => {
    if (!useMask) return undefined;

    const state = convertDayjsToMaskaFormat(displayFormat);
    return {
      mask: state.mask,
      tokens: state.tokens,
      tokensReplace: true,
      onMaska: (detail: MaskaDetail) => (maskState = detail),
    };
  });

  function handleInputChange(value: string | null) {
    if (!binding.control.enabled || binding.control.readonly) return;

    if (value == null) {
      maskState = {
        masked: '',
        unmasked: '',
        completed: false,
      };
    }

    if (useMask && value === '' && maskState.unmasked === '') {
      return;
    }

    const date = parseTemporalText(value, displayFormat);

    if (value && !date && (!useMask || !maskState.completed)) {
      textDraft = value;
      return;
    }
    textDraft = undefined;

    if (date) {
      value = date.format(saveFormat);
    }

    commitChanged(value);
  }

  function commitChanged(value: string | null | undefined) {
    if (adaptValue(value) !== binding.control.data) binding.onChange(value);
  }

  const inputValue = $derived.by(() => {
    if (textDraft !== undefined) return textDraft;
    const value = binding.control.data;
    const parsed = parseTemporalText(value, formats);
    return parsed ? parsed.format(displayFormat) : (value ?? '');
  });

  const form = useJsonForms();
  const authored = useAuthoredConfig();
  const resolveBounds = useTemporalDataBounds();
  const message = useRendererMessages();
  const translator = useTranslator();
  const restrict = $derived(temporalRestrict(localOptions(), authored.value));
  const schema = $derived(
    resolveBounds(
      binding.control.schema as Record<string, unknown>,
      binding.control.path,
      form.core?.data,
    ),
  );
  const useSeconds = $derived(
    displayFormat.includes('s') ||
      temporalTimeColumns(binding.appliedOptions.views)?.seconds === true,
  );
  const bounds = $derived(
    resolveTemporalBounds(
      restrict ? schema : {},
      formats,
      kind === 'date' ? 'day' : useSeconds ? 'second' : 'minute',
      kind === 'time',
    ),
  );

  function actionLabel(option: unknown, fallback: string) {
    return typeof option === 'string' ? translator.value(option, option) : message(fallback);
  }

  function parsePickerTime(timeValue: string | undefined) {
    return parseDateTime(
      timeValue ?? (useSeconds ? '00:00:00' : '00:00'),
      useSeconds ? 'HH:mm:ss' : 'HH:mm',
    );
  }

  function dateTimeRangeError(
    date: ReturnType<typeof parseDateTime>,
    timeValue: string | undefined,
  ) {
    if (!restrict || !date) return undefined;
    const time = parsePickerTime(timeValue);
    if (!time) return undefined;
    const candidate = resolvePickerDateTimeCandidate(date, time, binding.control.data, formats);
    for (const keyword of [
      'formatMinimum',
      'formatMaximum',
      'formatExclusiveMinimum',
      'formatExclusiveMaximum',
    ] as const) {
      const rawBound = schema[keyword];
      if (typeof rawBound !== 'string') continue;
      const bound = parseDateTime(rawBound, formats);
      if (!bound) continue;
      const lower = keyword === 'formatMinimum' || keyword === 'formatExclusiveMinimum';
      const exclusive =
        keyword === 'formatExclusiveMinimum' || keyword === 'formatExclusiveMaximum';
      if (
        (lower ? candidate.isBefore(bound) : candidate.isAfter(bound)) ||
        (exclusive && candidate.isSame(bound))
      )
        return message('dateTime.outOfRange');
    }
    return undefined;
  }

  return {
    handleInputChange,
    commitChanged,
    get pickerDate() {
      return parseDateTime(binding.control.data, formats);
    },
    get dateMode() {
      return temporalDateMode(binding.appliedOptions.views, displayFormat);
    },
    get showActions() {
      return binding.appliedOptions.showActions === true;
    },
    dateRangeError(value: string | undefined, open: boolean) {
      if (
        !open ||
        !value ||
        !restrict ||
        temporalDateMode(binding.appliedOptions.views, displayFormat) === 'date'
      )
        return undefined;
      const date = parseDateTime(value, 'YYYY-MM-DD');
      return !date || bounds.empty || !temporalValueWithinBounds(date, bounds, false)
        ? message('date.outOfRange')
        : undefined;
    },
    applyDateSelection(value: string | Date | null | undefined, notifyUnchanged = false) {
      if (bounds.empty) return;
      const date = parseDateTime(value, typeof value === 'string' ? 'YYYY-MM-DD' : undefined);
      if (date && !temporalValueWithinBounds(date, bounds, false)) return;
      const next = date ? date.format(saveFormat) : null;
      if (notifyUnchanged || adaptValue(next) !== binding.control.data) binding.onChange(next);
    },
    dateTimeRangeError,
    applyDateTimeSelection(
      date: ReturnType<typeof parseDateTime>,
      timeValue: string | undefined,
      commit?: (value: string | undefined) => void,
    ) {
      if ((bounds.empty && restrict) || dateTimeRangeError(date, timeValue)) return false;
      const time = parsePickerTime(timeValue);
      const selected =
        date && time
          ? resolvePickerDateTimeCandidate(date, time, binding.control.data, formats)
          : date;
      commit?.(selected?.format(saveFormat));
      return true;
    },
    pickerTimeBound(
      side: 'min' | 'max',
      date: ReturnType<typeof parseDateTime> | undefined,
      override?: unknown,
    ) {
      if (typeof override === 'string') return override;
      const bound = bounds[side];
      return date && bound && date.isSame(bound, 'day')
        ? bound.format(useSeconds ? 'HH:mm:ss' : 'HH:mm')
        : undefined;
    },
    get cancelLabel() {
      return actionLabel(binding.appliedOptions.cancelLabel, 'temporal.cancel');
    },
    get okLabel() {
      return actionLabel(binding.appliedOptions.okLabel, 'temporal.ok');
    },
    get useSeconds() {
      return useSeconds;
    },
    get restrict() {
      return restrict;
    },
    pickerDateBounds(min: unknown, max: unknown) {
      return {
        minDate: typeof min === 'string' ? min : bounds.min?.format('YYYY-MM-DD'),
        maxDate: typeof max === 'string' ? max : bounds.max?.format('YYYY-MM-DD'),
      };
    },
    calendarBounds<T>(picker: Record<string, unknown>, parse: (value: string | undefined) => T) {
      const { minDate, maxDate } = this.pickerDateBounds(picker.min, picker.max);
      return { pickerMin: parse(minDate), pickerMax: parse(maxDate) };
    },
    get bounds() {
      return bounds;
    },
    get boundsSchema() {
      return schema;
    },
    get displayFormat() {
      return displayFormat;
    },
    get saveFormat() {
      return saveFormat;
    },
    get formats() {
      return formats;
    },
    get maskOptions() {
      return maskOptions;
    },
    get inputValue() {
      return inputValue;
    },
    get coarseDateAttributes() {
      return {
        minimumYear: bounds.min?.year(),
        maximumYear: bounds.max?.year(),
        disabled: !binding.control.enabled || binding.control.readonly,
      };
    },
    get hintNotice() {
      return { controlId: binding.control.id, kind: 'hint' as const, text: this.draftHint };
    },
    get draftHint() {
      if (textDraft === undefined) return undefined;
      const key =
        kind === 'date'
          ? 'temporal.completeDate'
          : kind === 'time'
            ? 'temporal.completeTime'
            : 'temporal.completeDateTime';
      return message(key, { format: displayFormat });
    },
    get hasDraft() {
      return textDraft !== undefined;
    },
  };
}

/** A host data replacement invalidates a staged picker draft. */
export function watchPickerData(
  data: () => unknown,
  open: () => boolean,
  staged: () => boolean,
  close: () => void,
) {
  let openedData: unknown;
  $effect(() => {
    const current = data();
    if (!open()) openedData = current;
    else if (staged() && current !== openedData) close();
  });
}

export function focusPickerOnEscape(triggerId: () => string) {
  return (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const root = event.currentTarget instanceof Element ? event.currentTarget.getRootNode() : null;
    queueMicrotask(() => {
      if (root instanceof Document || root instanceof ShadowRoot)
        root.getElementById(triggerId())?.focus();
    });
  };
}

/** Share staged time, bounds and commit policy across native calendar value types. */
export function useDateTimePicker<T>(
  binding: Parameters<typeof useTemporalEditor>[1],
  editor: ReturnType<typeof useTemporalEditor>,
  calendar: {
    fromDate(date: ReturnType<typeof parseDateTime>): T;
    toDate(value: T): ReturnType<typeof parseDateTime>;
    selected(): T;
    commit?(value: string | undefined): void;
    timeBounds?(): Record<string, unknown>;
  },
) {
  const message = useRendererMessages();
  const draft = $state({ open: false, rejected: false, time: undefined as string | undefined });
  const showActions = $derived(binding.appliedOptions.showActions === true);
  const dateMode = $derived(temporalDateMode(binding.appliedOptions.views, editor.displayFormat));
  const ampm = $derived(binding.appliedOptions.ampm === true);
  const pickerValue = $derived.by(() => {
    const date = parseDateTime(binding.control.data, editor.formats);
    return {
      date: calendar.fromDate(date),
      time: date?.format(editor.useSeconds ? 'HH:mm:ss' : 'HH:mm'),
    };
  });
  const activeDate = $derived(calendar.toDate(draft.open ? calendar.selected() : pickerValue.date));
  const draftRangeError = $derived(
    editor.dateTimeRangeError(calendar.toDate(calendar.selected()), draft.time) ??
      (draft.rejected ? message('dateTime.outOfRange') : undefined),
  );
  $effect(() => {
    if (!draft.open) draft.rejected = false;
  });
  watchPickerData(
    () => binding.control.data,
    () => draft.open,
    () => showActions,
    () => {
      draft.open = false;
    },
  );
  function handlePickerChange(date: T, time: string | undefined, updateInput = false) {
    return editor.applyDateTimeSelection(
      calendar.toDate(date),
      time,
      !showActions || updateInput ? (calendar.commit ?? editor.commitChanged) : undefined,
    );
  }
  return {
    draft,
    get timeInput() {
      return {
        disabled: !binding.control.enabled || binding.control.readonly || editor.bounds.empty,
        views: binding.appliedOptions.views,
        value: draft.time ?? pickerValue.time,
        min: editor.pickerTimeBound('min', activeDate, calendar.timeBounds?.().min),
        max: editor.pickerTimeBound('max', activeDate, calendar.timeBounds?.().max),
        useSeconds: editor.useSeconds,
        ampm,
        onchange(value: string) {
          draft.rejected = false;
          draft.time = value;
          if (!showActions) handlePickerChange(calendar.selected(), value);
        },
        onrejected() {
          draft.rejected = true;
        },
      };
    },
    handlePickerChange,
    get pickerValue() {
      return pickerValue;
    },
    get showActions() {
      return showActions;
    },
    get dateMode() {
      return dateMode;
    },
    get ampm() {
      return ampm;
    },
    get monthYearOnly() {
      return dateMode !== 'date';
    },
    get draftRangeError() {
      return draftRangeError;
    },
    get initialTime() {
      return (
        pickerValue.time ??
        (dateMode !== 'date' ? (editor.useSeconds ? '00:00:00' : '00:00') : undefined)
      );
    },
  };
}
