/**
 * ALL portfolio content lives here. The terminal (ui/terminal.ts), the poster
 * art (scene/props/posters.ts) and the project panel (ui/panels.ts) read from
 * this file, so editing text or adding a project is a one-file change.
 */

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  url?: string;
  /** 'live' projects get real poster art; 'slot' is an empty frame for later. */
  status: 'live' | 'slot';
}

export const profile = {
  name: 'Disath',
  role: 'Bachelor of IT student · AI major',
  location: 'Sydney, Australia',
  about: [
    "I'm Disath, a Bachelor of IT student majoring in Artificial Intelligence in Sydney.",
    'I like building things that feel like places: small games, strange interfaces and tools that learn.',
    'This room is my portfolio. It is always 2am here, it is always raining, and the cat never wakes up.',
  ],
};

// EDIT ME: adjust to your real stack.
export const skills: { group: string; items: string[] }[] = [
  { group: 'AI / ML', items: ['Python', 'Machine learning fundamentals', 'Neural networks', 'Data wrangling'] },
  { group: 'Web / Graphics', items: ['TypeScript', 'Three.js / WebGL', 'HTML + CSS', 'Vite'] },
  { group: 'Games', items: ['Game design', 'Atmosphere + horror pacing', 'Procedural audio'] },
  { group: 'Tools', items: ['Git + GitHub', 'GitHub Pages / Actions', 'Linux shell'] },
];

export const projects: Project[] = [
  {
    id: 'last-shift',
    title: 'Last Shift',
    tagline: 'A foggy roadhouse horror game',
    description:
      'You are alone on the night shift at a roadhouse the fog has swallowed. Keep the lights on, serve whoever walks in, and try not to look too closely at the road.',
    tags: ['Horror', 'Browser game', 'Atmosphere'],
    url: 'https://disathwickrama.github.io/Last-Shift/',
    status: 'live',
  },
  {
    id: 'slot-02',
    title: 'Project 02',
    tagline: 'Reserved wall space',
    description: 'Something is being built for this frame. Check back soon.',
    tags: ['In development'],
    status: 'slot',
  },
  {
    id: 'slot-03',
    title: 'Project 03',
    tagline: 'Reserved wall space',
    description: 'An empty frame, waiting for the next idea that will not leave me alone.',
    tags: ['In development'],
    status: 'slot',
  },
];

export const contact: { label: string; value: string; url?: string }[] = [
  { label: 'GitHub', value: 'github.com/DisathWickrama', url: 'https://github.com/DisathWickrama' },
  { label: 'Play', value: 'Last Shift', url: 'https://disathwickrama.github.io/Last-Shift/' },
  // Add more, e.g. { label: 'Email', value: 'you@example.com', url: 'mailto:you@example.com' },
];
