/**
 * HUD: always-on chrome over the 3D view. Brand, the three toggles (day/night,
 * rain sound, music), a back button while the camera is focused on something,
 * quick-nav buttons (so every hotspot is reachable without precise tapping),
 * toasts and the intro screen. It only renders and reports clicks; main.ts
 * decides what they do.
 */
export interface HudActions {
  onBack(): void;
  onToggleDay(): void;
  onToggleRain(): void;
  onToggleMusic(): void;
  onNav(id: 'terminal' | 'projects' | 'music'): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export class Hud {
  readonly root = el('div', 'hud');
  private dayBtn = el('button', 'pill', '<i></i><span>Night</span>');
  private rainBtn = el('button', 'pill', '<i></i><span>Rain</span>');
  private musicBtn = el('button', 'pill', '<i></i><span>Music</span>');
  private toastEl = el('div', 'toast');
  private toastTimer = 0;
  private sub!: HTMLElement;

  constructor(parent: HTMLElement, actions: HudActions, touch: boolean) {
    const brand = el('div', 'brand', '<b>DISATH</b><span>room · 2am · sydney</span>');
    this.sub = brand.querySelector('span')!;
    const controls = el('div', 'controls');
    this.dayBtn.setAttribute('aria-label', 'Toggle day and night');
    this.rainBtn.setAttribute('aria-label', 'Toggle rain sound');
    this.musicBtn.setAttribute('aria-label', 'Toggle lo-fi music');
    this.dayBtn.onclick = actions.onToggleDay;
    this.rainBtn.onclick = actions.onToggleRain;
    this.musicBtn.onclick = actions.onToggleMusic;
    controls.append(this.dayBtn, this.rainBtn, this.musicBtn);

    const back = el('button', 'pill back', '← Back to room');
    back.onclick = actions.onBack;

    const bottom = el('div', 'bottom');
    const nav = el('div', 'nav');
    for (const [id, label] of [['terminal', 'Terminal'], ['projects', 'Projects'], ['music', 'Record player']] as const) {
      const b = el('button', 'pill', label);
      b.onclick = () => actions.onNav(id);
      nav.appendChild(b);
    }
    const hint = el('div', 'hint', touch ? 'Tap the glowing things' : 'Click the monitor, the posters or the record player');
    bottom.append(hint, nav);
    this.root.append(brand, controls, back, bottom, this.toastEl);
    parent.appendChild(this.root);
  }

  setFocused(on: boolean) { this.root.classList.toggle('focused', on); }
  setHidden(on: boolean) { this.root.classList.toggle('hidden', on); }
  setDay(isDay: boolean) {
    this.dayBtn.classList.toggle('on', isDay);
    this.dayBtn.querySelector('span')!.textContent = isDay ? 'Day' : 'Night';
    this.sub.textContent = isDay ? 'room · rainy morning · sydney' : 'room · 2am · sydney';
  }
  setRain(on: boolean) { this.rainBtn.classList.toggle('on', on); }
  setMusic(on: boolean) { this.musicBtn.classList.toggle('on', on); }

  toast(msg: string) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 2200);
  }

  /** Title card. The button click is the user gesture that unlocks audio. */
  showIntro(parent: HTMLElement, onEnter: () => void) {
    const intro = el('div', 'intro', `<div><h1>2:00 <em>AM</em></h1>
      <p>It's raining over Sydney. The lamp is still on. Come in, look around, try not to wake the cat.</p>
      <button type="button">Enter the room</button><small>best with sound on</small></div>`);
    intro.querySelector('button')!.onclick = () => {
      intro.classList.add('gone');
      setTimeout(() => intro.remove(), 1000);
      onEnter();
    };
    parent.appendChild(intro);
  }
}
