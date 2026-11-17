/**
 * Full-screen command terminal (opened by the CRT monitor).
 *
 * Styled as an original retro "emergency console": condensed bold type,
 * orange/purple/black, hexagon warning panels, a boot sequence. The look is a
 * style only - it uses no names, logos or characters from any existing work.
 *
 * Content comes from data/portfolio.ts. Commands are a plain lookup table
 * (name -> function returning lines), so adding one is a few lines. Scene
 * side-effects (music, day/night, rain, exit) go through TerminalActions.
 */
import { profile, skills, projects, contact } from '../data/portfolio';

export interface TerminalActions {
  onExit(): void;
  toggleMusic(): boolean;
  toggleDay(): boolean;
  toggleRain(): boolean;
}

interface Line {
  text: string;
  cls?: string;
  href?: string;
  /** Clicking the line runs this command (touch-friendly). */
  run?: string;
}

const L = (text: string, cls?: string): Line => ({ text, cls });
const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));

export class Terminal {
  isOpen = false;
  private root = document.createElement('section');
  private out!: HTMLElement;
  private input!: HTMLInputElement;
  private bootEl!: HTMLElement;
  private clock!: HTMLElement;
  private queue: Line[] = [];
  private printing = 0;
  private booted = false;
  private history: string[] = [];
  private hIndex = 0;
  private clockTimer = 0;
  private commands: Record<string, (args: string[]) => Line[] | void>;

  constructor(parent: HTMLElement, private actions: TerminalActions) {
    this.root.className = 'term';
    this.root.setAttribute('aria-label', 'Portfolio command terminal');
    this.root.innerHTML = `
      <div class="term-frame">
        <header class="term-head">
          <div class="term-brand"><b>Nocturne</b><i>Command System</i></div>
          <div class="term-hexes">
            <span class="hex blink"><em>警告</em></span><span class="hex p"><em>Link<br>OK</em></span>
            <span class="hex fill"><em>02:00</em></span><span class="hex p blink"><em>Rain</em></span><span class="hex"><em>Core<br>Hot</em></span>
          </div>
          <div class="term-meta"><button class="term-exit" type="button">Exit ×</button><span>Operator // ${profile.name}</span><span class="clock">--:--:--</span></div>
        </header>
        <div class="term-body">
          <aside class="term-side">
            <div class="stat">Uplink<b>Stable</b><div class="meter"><i></i></div></div>
            <div class="stat p">Signal<b>Sydney</b><div class="meter"><i></i></div></div>
            <div class="stat warn">Caution<b>Caffeine low</b></div>
            <div class="stat p">Sleep cycle<b>Not found</b></div>
            <div class="vert">非常事態 // NIGHT WATCH</div>
          </aside>
          <div class="term-out" role="log" aria-live="polite"></div>
        </div>
        <nav class="term-nav"></nav>
        <form class="term-in"><label for="term-input">D-01 ▶</label><input id="term-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Command input" /></form>
      </div>
      <div class="term-boot"><div>
        <div class="grid">${'<span class="hex"><em>警告</em></span><span class="hex fill"><em>Boot</em></span><span class="hex p"><em>Wake</em></span>'.repeat(2)}</div>
        <h3>SYSTEM START</h3><p>Emergency night watch console</p>
      </div></div>`;
    parent.appendChild(this.root);
    this.out = this.root.querySelector('.term-out')!;
    this.input = this.root.querySelector('input')!;
    this.bootEl = this.root.querySelector('.term-boot')!;
    this.clock = this.root.querySelector('.clock')!;

    const nav = this.root.querySelector('.term-nav')!;
    for (const c of ['about', 'skills', 'projects', 'contact', 'help']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.onclick = () => this.exec(c);
      nav.appendChild(b);
    }
    this.root.querySelector<HTMLButtonElement>('.term-exit')!.onclick = () => this.actions.onExit();
    this.root.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = this.input.value;
      this.input.value = '';
      this.exec(v);
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    this.out.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-run]');
      if (t) this.exec(t.dataset.run!);
    });
    this.bootEl.addEventListener('click', () => this.finishBoot());

    this.commands = {
      help: () => [
        { text: 'Directives', cls: 'h' },
        ...[
          ['about', 'who is at the console'],
          ['skills', 'loadout'],
          ['projects', 'deployed units'],
          ['open <n>', 'launch a project (e.g. open 1)'],
          ['contact', 'open a channel'],
          ['music', 'toggle the record player'],
          ['day / night', 'flip the sky'],
          ['rain', 'toggle rain sound'],
          ['clear', 'wipe the screen'],
          ['exit', 'back to the room'],
        ].map(([c, d]) => ({ text: `  ${pad(c, 14)}${d}`, run: c.includes('<') || c.includes('/') ? undefined : c })),
        L('Tip: Tab completes, ↑/↓ recalls, Esc exits.', 'dim'),
      ],
      about: () => [
        { text: `Operator file // ${profile.name}`, cls: 'h' },
        ...profile.about.map((t) => L(t)),
        L(''),
        L(`  ROLE      ${profile.role}`, 'p'),
        L(`  LOCATION  ${profile.location}`, 'p'),
        { text: '  NEXT      projects', cls: 'dim', run: 'projects' },
      ],
      skills: () => [
        { text: 'Loadout', cls: 'h' },
        ...skills.flatMap((g) => [L(`▮ ${g.group.toUpperCase()}`, 'ok'), ...g.items.map((i) => L(`    · ${i}`))]),
      ],
      projects: () => [
        { text: 'Deployed units', cls: 'h' },
        ...projects.flatMap((p, i) => [
          { text: `  [${String(i + 1).padStart(2, '0')}] ${pad(p.title.toUpperCase(), 14)}${p.status === 'live' ? 'ONLINE' : 'IN DEVELOPMENT'}`, cls: p.status === 'live' ? 'ok' : 'dim', run: `open ${i + 1}` },
          L(`       ${p.tagline}`, p.status === 'live' ? undefined : 'dim'),
        ]),
        L('Type "open 1" or click a line to launch.', 'dim'),
      ],
      open: (a) => {
        const key = (a[0] ?? '').toLowerCase();
        const p = projects[Number(key) - 1] ?? projects.find((x) => x.id === key || x.title.toLowerCase().replace(/\s+/g, '-') === key);
        if (!p) return [L('NO SUCH UNIT', 'warn'), L('Try: projects', 'dim')];
        if (!p.url) return [L(`${p.title.toUpperCase()}: frame is empty. Still being built.`, 'p')];
        window.open(p.url, '_blank', 'noopener');
        return [L(`Launching ${p.title.toUpperCase()} ...`, 'ok'), { text: `  ${p.url}`, href: p.url }, L(p.description, 'dim')];
      },
      contact: () => [
        { text: 'Open channels', cls: 'h' },
        ...contact.map((c) => ({ text: `  ${pad(c.label.toUpperCase(), 10)}${c.value}`, href: c.url })),
      ],
      clear: () => { this.queue = []; this.out.textContent = ''; },
      exit: () => this.actions.onExit(),
      music: () => [L(this.actions.toggleMusic() ? 'RECORD PLAYER: SPINNING' : 'RECORD PLAYER: STOPPED', 'ok')],
      rain: () => [L(this.actions.toggleRain() ? 'RAIN AUDIO: ON' : 'RAIN AUDIO: OFF', 'ok')],
      day: () => [L(this.setDay(true), 'ok')],
      night: () => [L(this.setDay(false), 'ok')],
      whoami: () => [L('guest // visitor clearance. Welcome in.', 'p')],
      date: () => [L(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'full', timeStyle: 'medium' }) + ' (Sydney)')],
      ls: () => [L('about   skills   projects   contact', 'p')],
      sudo: () => [L('PERMISSION DENIED', 'warn'), L('Nice try. The cat has root.', 'dim')],
      coffee: () => [L('CAFFEINE RESERVES: CRITICAL', 'warn'), L('The mug on the desk is doing its best.', 'dim')],
    };
    this.commands.quit = this.commands.exit;
    this.commands.cls = this.commands.clear;
    this.commands['?'] = this.commands.help;
  }

  private isDay = false;
  private setDay(want: boolean) {
    if (this.isDay !== want) this.isDay = this.actions.toggleDay();
    return want ? 'SKY: RAINY MORNING' : 'SKY: 02:00';
  }
  /** main.ts keeps the terminal in sync when the HUD toggles day/night. */
  syncDay(isDay: boolean) { this.isDay = isDay; }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.root.classList.remove('closing');
    this.root.classList.add('open');
    const tick = () => (this.clock.textContent = new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour12: false }));
    tick();
    this.clockTimer = window.setInterval(tick, 1000);
    if (!this.booted) this.boot();
    else this.focusInput();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    clearInterval(this.clockTimer);
    this.root.classList.add('closing');
    this.input.blur();
    setTimeout(() => { if (!this.isOpen) this.root.classList.remove('open', 'closing'); }, 300);
  }

  private focusInput() {
    // don't pop the on-screen keyboard uninvited on touch devices
    if (!matchMedia('(pointer: coarse)').matches) this.input.focus();
  }

  private bootTimer = 0;
  private boot() {
    this.booted = true;
    this.bootTimer = window.setTimeout(() => this.finishBoot(), 1700);
  }
  private finishBoot() {
    if (this.bootEl.classList.contains('done')) return;
    clearTimeout(this.bootTimer);
    this.bootEl.classList.add('done');
    this.print([
      L('NOCTURNE COMMAND SYSTEM  rev 2.06', 'ok'),
      L('MEMORY CHECK ............ OK', 'dim'),
      L('UPLINK / SYDNEY ......... OK', 'dim'),
      L('RAIN SENSOR ............. HEAVY', 'dim'),
      L('SLEEP SCHEDULE .......... NOT FOUND', 'dim'),
      L('CAFFEINE RESERVES LOW', 'warn'),
      L(''),
      { text: `Operator // ${profile.name}`, cls: 'h' },
      L(profile.about[0]),
      L(''),
      { text: 'Type HELP for directives, or pick one below:', cls: 'p' },
      { text: '  › about', run: 'about' },
      { text: '  › skills', run: 'skills' },
      { text: '  › projects', run: 'projects' },
      { text: '  › contact', run: 'contact' },
    ]);
    this.focusInput();
  }

  exec(raw: string) {
    const text = raw.trim();
    if (!this.bootEl.classList.contains('done')) this.finishBoot();
    if (!text) return;
    this.history.push(text);
    this.hIndex = this.history.length;
    const [name, ...args] = text.toLowerCase().split(/\s+/);
    const lines: Line[] = [L(`D-01 ▶ ${text}`, 'echo')];
    const cmd = Object.prototype.hasOwnProperty.call(this.commands, name) ? this.commands[name] : undefined;
    if (!cmd) lines.push(L('UNKNOWN DIRECTIVE', 'warn'), L(`"${name}" is not recognised. Type HELP.`, 'dim'));
    else {
      const res = cmd(args);
      if (res) lines.push(...res);
      else if (name === 'clear' || name === 'cls' || name === 'exit' || name === 'quit') return;
    }
    lines.push(L(''));
    this.print(lines);
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.hIndex = Math.max(0, Math.min(this.history.length, this.hIndex + (e.key === 'ArrowUp' ? -1 : 1)));
      this.input.value = this.history[this.hIndex] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = this.input.value.toLowerCase();
      const hit = v && Object.keys(this.commands).filter((c) => c.startsWith(v));
      if (hit && hit.length === 1) this.input.value = hit[0];
      else if (hit && hit.length > 1) this.print([L(hit.join('   '), 'dim')]);
    }
  }

  /** Lines are revealed one at a time for the teletype feel. */
  private print(lines: Line[]) {
    this.queue.push(...lines);
    if (this.printing) return;
    const step = () => {
      const n = this.queue.length > 30 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const ln = this.queue.shift();
        if (ln) this.append(ln);
      }
      this.out.scrollTop = this.out.scrollHeight;
      this.printing = this.queue.length ? window.setTimeout(step, 28) : 0;
    };
    step();
  }

  private append(ln: Line) {
    const row = document.createElement('div');
    row.className = 'ln';
    let node: HTMLElement;
    if (ln.href) {
      const a = document.createElement('a');
      a.href = ln.href;
      a.target = '_blank';
      a.rel = 'noopener';
      node = a;
    } else {
      node = document.createElement('span');
      if (ln.run) { node.dataset.run = ln.run; node.classList.add('run'); node.setAttribute('role', 'button'); }
    }
    if (ln.cls) node.classList.add(ln.cls);
    // keep indentation outside links/buttons so the underline hugs the words
    const indent = ln.href || ln.run ? ln.text.length - ln.text.trimStart().length : 0;
    if (indent) row.append(ln.text.slice(0, indent));
    node.textContent = ln.text.slice(indent);
    row.appendChild(node);
    this.out.appendChild(row);
  }
}
