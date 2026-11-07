import { getContext } from 'svelte';

/** Author-facing runtime diagnostic; never contributes to document validity. */
export interface UIDiagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export type UIDiagnosticSink = (diagnostic: UIDiagnostic) => void;

export const UIDiagnosticContextSymbol = Symbol('jsonforms-ui-diagnostic');

export type UIDiagnosticPayload = Omit<UIDiagnostic, 'code'> & Record<string, unknown>;
export type UIDiagnosticReporter = (code: string, payload: UIDiagnosticPayload) => void;

export function emitUIDiagnostic(
  sink: UIDiagnosticSink | undefined,
  code: string,
  payload: UIDiagnosticPayload,
): void {
  if (payload.severity === 'error') console.error(code, payload);
  else console.warn(code, payload);
  if (!sink) return;

  const { severity, message, details, ...context } = payload;
  const diagnosticDetails = { ...context, ...details };
  sink({
    code,
    severity,
    message,
    ...(Object.keys(diagnosticDetails).length > 0 ? { details: diagnosticDetails } : {}),
  });
}

/** Capture the owning form's sink during component initialization. */
export function useUIDiagnosticReporter(): UIDiagnosticReporter {
  const sink = getContext<UIDiagnosticSink | undefined>(UIDiagnosticContextSymbol);

  return (code: string, payload: UIDiagnosticPayload): void =>
    emitUIDiagnostic(sink, code, payload);
}
