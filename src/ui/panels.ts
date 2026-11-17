/**
 * Side panels shown while the camera is focused on an object:
 *   ProjectPanel - details + link for the poster you clicked
 *   VinylPanel   - play/pause and volume for the record player
 * Both are dumb views; main.ts feeds them data and handles their callbacks.
 */
import type { Project } from '../data/portfolio';

function make(parent: HTMLElement, html: string) {
  const p = document.createElement('aside');
  p.className = 'panel';
  p.innerHTML = `<button class="close" type="button" aria-label="Close">×</button>${html}`;
  parent.appendChild(p);
  return p;
}

export class ProjectPanel {
  private root: HTMLElement;
  constructor(parent: HTMLElement, cb: { onClose(): void; onStep(dir: 1 | -1): void }) {
    this.root = make(parent, `<div class="kicker"></div><h2></h2><p class="tag"></p><p class="desc"></p><div class="chips"></div>
      <div class="row"><span class="cta-slot"></span><button class="ghost prev" type="button" aria-label="Previous poster">←</button><button class="ghost next" type="button" aria-label="Next poster">→</button></div>`);
    this.root.querySelector<HTMLElement>('.close')!.onclick = () => cb.onClose();
    this.root.querySelector<HTMLElement>('.prev')!.onclick = () => cb.onStep(-1);
    this.root.querySelector<HTMLElement>('.next')!.onclick = () => cb.onStep(1);
  }

  show(p: Project, index: number, total: number) {
    const q = <T extends HTMLElement>(s: string) => this.root.querySelector<T>(s)!;
    q('.kicker').textContent = `Poster ${index + 1} / ${total} · ${p.status === 'live' ? 'Playable now' : 'Coming soon'}`;
    q('h2').textContent = p.title;
    q('.tag').textContent = p.tagline;
    q('.desc').textContent = p.description;
    q('.chips').replaceChildren(...p.tags.map((t) => Object.assign(document.createElement('span'), { textContent: t })));
    const slot = q('.cta-slot');
    if (p.url) {
      const a = Object.assign(document.createElement('a'), { className: 'cta', href: p.url, target: '_blank', rel: 'noopener', textContent: 'Open project ↗' });
      slot.replaceChildren(a);
    } else {
      slot.replaceChildren(Object.assign(document.createElement('span'), { className: 'cta off', textContent: 'Coming soon' }));
    }
    this.root.classList.add('show');
  }
  hide() { this.root.classList.remove('show'); }
}

export class VinylPanel {
  private root: HTMLElement;
  private playBtn: HTMLButtonElement;
  constructor(parent: HTMLElement, cb: { onClose(): void; onToggle(): void; onVolume(v: number): void }, volume: number) {
    this.root = make(parent, `<div class="kicker">Record player · generated live</div><h2>2AM Tape</h2>
      <p class="tag">Lo-fi beats synthesised in your browser. No samples, never the same twice.</p>
      <div class="eq">${'<i></i>'.repeat(18)}</div>
      <div class="row"><button class="cta play" type="button">▶ Play</button></div>
      <label class="vol">Vol<input type="range" min="0" max="1" step="0.01" value="${volume}" aria-label="Music volume" /></label>`);
    this.playBtn = this.root.querySelector('.play')!;
    this.playBtn.onclick = () => cb.onToggle();
    this.root.querySelector<HTMLElement>('.close')!.onclick = () => cb.onClose();
    const range = this.root.querySelector<HTMLInputElement>('input')!;
    range.oninput = () => cb.onVolume(Number(range.value));
  }
  show() { this.root.classList.add('show'); }
  hide() { this.root.classList.remove('show'); }
  setPlaying(on: boolean) {
    this.root.classList.toggle('playing', on);
    this.playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
  }
}
