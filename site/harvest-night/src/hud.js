// hud.js — DOM overlay. Phase 2: key counter, interact prompt, objective hints,
// win screen. Stamina/flashlight/vignettes land in Phase 5.

const ORANGE = '#ffa640';

function el(tag, styles = {}, html = '') {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  if (html) e.innerHTML = html;
  return e;
}

export class HUD {
  constructor() {
    this.root = el('div', {
      position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '50',
      fontFamily: '"Trebuchet MS", monospace, sans-serif', color: ORANGE,
      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    });
    document.body.appendChild(this.root);

    // Key counter, top-left.
    this.keyIcons = [];
    this.keyCounter = el('div', {
      position: 'absolute', top: '18px', left: '18px', display: 'flex', gap: '8px',
    });
    for (let i = 0; i < 3; i++) {
      const icon = el('div', {
        fontSize: '28px', opacity: '0.35', filter: 'grayscale(1)', transition: 'opacity 0.3s, filter 0.3s',
      }, '🎃');
      this.keyIcons.push(icon);
      this.keyCounter.appendChild(icon);
    }
    this.root.appendChild(this.keyCounter);

    // Objective hint, top-center, fades after 5s.
    this.hint = el('div', {
      position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
      fontSize: '15px', letterSpacing: '0.5px', opacity: '0', transition: 'opacity 0.6s',
      maxWidth: '80vw', textAlign: 'center',
    });
    this.root.appendChild(this.hint);
    this._hintTimer = null;

    // Interact prompt, center.
    this.prompt = el('div', {
      position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%,-50%)',
      fontSize: '17px', fontWeight: 'bold', opacity: '0', transition: 'opacity 0.15s',
      textAlign: 'center', whiteSpace: 'nowrap',
    });
    this.root.appendChild(this.prompt);

    // Gate hold progress bar, under the prompt.
    this.holdBarOuter = el('div', {
      position: 'absolute', top: 'calc(58% + 32px)', left: '50%', transform: 'translateX(-50%)',
      width: '220px', height: '10px', border: `2px solid ${ORANGE}`, borderRadius: '6px',
      opacity: '0', transition: 'opacity 0.15s', overflow: 'hidden', background: 'rgba(0,0,0,0.4)',
    });
    this.holdBarInner = el('div', {
      width: '0%', height: '100%', background: ORANGE,
    });
    this.holdBarOuter.appendChild(this.holdBarInner);
    this.root.appendChild(this.holdBarOuter);

    // Win screen.
    this.winScreen = el('div', {
      position: 'fixed', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '14px', background: 'rgba(15,10,25,0)',
      transition: 'background 1.5s ease', zIndex: '60', pointerEvents: 'auto', textAlign: 'center',
    });
    this.winTitle = el('div', { fontSize: '48px', fontWeight: '900', letterSpacing: '2px' }, 'YOU MADE IT');
    this.winTime = el('div', { fontSize: '20px', color: '#f4f0ff' }, '');
    this.winRestart = el('button', {
      marginTop: '10px', background: `linear-gradient(180deg, ${ORANGE}, #e8790c)`, color: '#2a1400',
      border: 'none', padding: '14px 30px', borderRadius: '999px', fontWeight: '900', fontSize: '16px',
      boxShadow: '0 5px 0 #8a4a00', cursor: 'pointer',
    }, 'Play Again');
    this.winRestart.addEventListener('click', () => location.reload());
    this.winScreen.appendChild(this.winTitle);
    this.winScreen.appendChild(this.winTime);
    this.winScreen.appendChild(this.winRestart);
    document.body.appendChild(this.winScreen);
  }

  setKeyCount(n) {
    this.keyIcons.forEach((icon, i) => {
      const lit = i < n;
      icon.style.opacity = lit ? '1' : '0.35';
      icon.style.filter = lit ? 'none' : 'grayscale(1)';
    });
  }

  showHint(text) {
    this.hint.textContent = text;
    this.hint.style.opacity = '1';
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => { this.hint.style.opacity = '0'; }, 5000);
  }

  showPrompt(text) {
    this.prompt.textContent = text;
    this.prompt.style.opacity = '1';
  }

  hidePrompt() {
    this.prompt.style.opacity = '0';
  }

  setHoldProgress(fraction) {
    if (fraction <= 0) {
      this.holdBarOuter.style.opacity = '0';
      return;
    }
    this.holdBarOuter.style.opacity = '1';
    this.holdBarInner.style.width = `${Math.min(1, fraction) * 100}%`;
  }

  showWinScreen(timeSeconds) {
    const mm = Math.floor(timeSeconds / 60);
    const ss = Math.floor(timeSeconds % 60).toString().padStart(2, '0');
    this.winTime.textContent = `Time: ${mm}:${ss}`;
    this.winScreen.style.display = 'flex';
    requestAnimationFrame(() => { this.winScreen.style.background = 'rgba(40,25,20,0.94)'; });
  }
}
