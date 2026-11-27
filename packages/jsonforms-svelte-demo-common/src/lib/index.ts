export { default as DemoPageHead } from './components/DemoPageHead.svelte';
export { default as DemoShell } from './components/DemoShell.svelte';
export { default as DemoExamplePanels } from './components/DemoExamplePanels.svelte';
export { default as DemoExamplePreview } from './components/DemoExamplePreview.svelte';
export { default as DemoEditorPane } from './components/DemoEditorPane.svelte';
export { editorColorScale } from './core/monacoTheme';
export { default as DemoEditorHeading } from './components/DemoEditorHeading.svelte';
export { default as DemoExampleHeading } from './components/DemoExampleHeading.svelte';
export { default as DemoDataSplit } from './components/DemoDataSplit.svelte';
export * from './core';
export * from './examples';
export * from './i18n';
export * from './store';
export { getDemoArrayCollapsed, mergeDemoConfig, setDemoArrayCollapsed } from './demoConfig';
export { manageNarrowDrawerFocus } from './drawerFocus';

export { default as SpecSourceLink } from './components/SpecSourceLink.svelte';

export { default as ExternalEditor } from './components/ExternalEditor.svelte';
export { default as WebComponentLogo } from './components/WebComponentLogo.svelte';
export type { DemoWebComponentProps } from './components/demoWebComponent';
export { default as DemoMonacoEditor } from './components/DemoMonacoEditor.svelte';
export { demoEditorTheme, type DemoMonacoEditorProps } from './components/demoMonaco';
export { default as PlaygroundConfiguration } from './components/PlaygroundConfiguration.svelte';
export { default as DemoValidationStatus } from './components/DemoValidationStatus.svelte';
export { createDemoMonacoTheme, resolveCSSColor } from './core/monacoTheme';
export { useDemoSidebar } from './core/demoSidebar.svelte';
export { addErrorKeywords, settingsOptions } from './core/settingsOptions';
export { useDemoLayout } from './core/demoLayout.svelte';

export { useDemoNavbar } from './core/demoNavbar.svelte';

export { default as DemoExampleFrame } from './components/DemoExampleFrame.svelte';

export { default as DemoExampleForm } from './components/DemoExampleForm.svelte';

export { default as EditorActionIcon } from './components/EditorActionIcon.svelte';

export { default as DemoWebComponent } from './components/DemoWebComponent.svelte';
