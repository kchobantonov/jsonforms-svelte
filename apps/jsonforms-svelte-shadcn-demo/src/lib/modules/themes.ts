const themeCss = (primary: string, secondary: string, accent: string) => `
:root, [data-theme] {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: ${primary};
  --primary-foreground: 210 40% 98%;
  --secondary: ${secondary};
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: ${accent};
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: ${primary};
  --radius: 0.5rem;
}

[data-mode='dark'], [data-mode='dark'] * {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
}
`;

export const themes = [
  {
    name: 'slate',
    css: themeCss('222.2 47.4% 11.2%', '210 40% 96.1%', '210 40% 96.1%'),
    emoji: 'S',
  },
  { name: 'zinc', css: themeCss('240 5.9% 10%', '240 4.8% 95.9%', '240 4.8% 95.9%'), emoji: 'Z' },
  { name: 'neutral', css: themeCss('0 0% 9%', '0 0% 96.1%', '0 0% 96.1%'), emoji: 'N' },
  { name: 'stone', css: themeCss('24 9.8% 10%', '60 4.8% 95.9%', '60 4.8% 95.9%'), emoji: 'T' },
  { name: 'red', css: themeCss('0 72.2% 50.6%', '0 0% 96.1%', '0 0% 96.1%'), emoji: 'R' },
  {
    name: 'orange',
    css: themeCss('20.5 90.2% 48.2%', '60 4.8% 95.9%', '60 4.8% 95.9%'),
    emoji: 'O',
  },
  {
    name: 'green',
    css: themeCss('142.1 76.2% 36.3%', '210 40% 96.1%', '210 40% 96.1%'),
    emoji: 'G',
  },
  {
    name: 'blue',
    css: themeCss('221.2 83.2% 53.3%', '210 40% 96.1%', '210 40% 96.1%'),
    emoji: 'B',
  },
] as const;

export type DemoThemeName = (typeof themes)[number]['name'];
export type DemoMode = 'system' | 'light' | 'dark';
