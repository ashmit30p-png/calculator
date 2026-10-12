/**
 * AshCalc - Modern Scientific & Standard Calculator
 */

class AshCalc {
  constructor() {
    this.expression = '';
    this.currentVal = '0';
    this.isEvaluated = false;
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.isSecondFn = false;
    this.soundEnabled = true;
    this.history = JSON.parse(localStorage.getItem('ashCalcHistory') || localStorage.getItem('omniCalcHistory') || '[]');

    // Audio Context for tactile sound feedback
    this.audioCtx = null;

    this.initDOM();
    this.initEventListeners();
    this.initTheme();
    this.renderHistory();
  }

  initDOM() {
    this.expressionDisplay = document.getElementById('expressionDisplay');
    this.resultDisplay = document.getElementById('resultDisplay');
    this.historyDrawer = document.getElementById('historyDrawer');
    this.historyList = document.getElementById('historyList');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.historyToggleBtn = document.getElementById('historyToggleBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.angleUnitBtn = document.getElementById('angleUnitBtn');
    this.secondFnBtn = document.getElementById('secondFnBtn');
    this.appContainer = document.querySelector('.app-container');
    this.tabButtons = document.querySelectorAll('.tab-btn');
  }

  initEventListeners() {
    // Mode tabs (Standard / Scientific)
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const mode = btn.dataset.mode;
        if (mode === 'scientific') {
          this.appContainer.classList.add('mode-scientific');
        } else {
          this.appContainer.classList.remove('mode-scientific');
        }
        this.playTone(400, 0.04);
      });
    });

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', nextTheme);
      localStorage.setItem('ashCalcTheme', nextTheme);
      this.themeToggleBtn.querySelector('.theme-icon').textContent = nextTheme === 'dark' ? '🌙' : '☀️';
      this.playTone(550, 0.04);
    });

    // History Toggle & Drawer
    this.historyToggleBtn.addEventListener('click', () => this.toggleHistory(true));
    this.closeHistoryBtn.addEventListener('click', () => this.toggleHistory(false));
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Sound Toggle
    this.soundToggleBtn.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.soundToggleBtn.classList.toggle('active', this.soundEnabled);
      this.soundToggleBtn.querySelector('.sound-icon').textContent = this.soundEnabled ? '🔊' : '🔇';
    });

    // Copy Button
    this.copyBtn.addEventListener('click', () => this.copyToClipboard());

    // Angle Unit Toggle (DEG / RAD)
    if (this.angleUnitBtn) {
      this.angleUnitBtn.addEventListener('click', () => {
        this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.angleUnitBtn.textContent = this.angleMode;
        this.playTone(480, 0.05);
      });
    }

    // 2nd Function Toggle
    if (this.secondFnBtn) {
      this.secondFnBtn.addEventListener('click', () => {
        this.isSecondFn = !this.isSecondFn;
        this.secondFnBtn.classList.toggle('active', this.isSecondFn);
        const primaryFns = document.querySelectorAll('.fn-primary');
        const altFns = document.querySelectorAll('.fn-alt');
        primaryFns.forEach(el => el.classList.toggle('hidden', this.isSecondFn));
        altFns.forEach(el => el.classList.toggle('hidden', !this.isSecondFn));
        this.playTone(520, 0.05);
      });
    }

    // Keypad Click Event (Delegation)
    document.getElementById('keypad').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      this.handleButtonPress(btn);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  initTheme() {
    const savedTheme = localStorage.getItem('ashCalcTheme') || localStorage.getItem('omniCalcTheme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    this.themeToggleBtn.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  // Audio tone generator
  playTone(freq = 440, duration = 0.03) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (_) {}
  }

  toggleHistory(open) {
    if (open) {
      this.historyDrawer.classList.add('open');
      this.historyDrawer.setAttribute('aria-hidden', 'false');
    } else {
      this.historyDrawer.classList.remove('open');
      this.historyDrawer.setAttribute('aria-hidden', 'true');
    }
    this.playTone(380, 0.04);
  }

  updateDisplay() {
    this.expressionDisplay.innerHTML = this.formatExpressionForDisplay(this.expression) || '&nbsp;';
    this.resultDisplay.textContent = this.formatNumber(this.currentVal);
  }

  formatNumber(valStr) {
    if (valStr === 'Error' || valStr === 'Infinity' || valStr === '-Infinity' || valStr === 'NaN') {
      return valStr;
    }
    if (valStr.endsWith('.')) return valStr;
    const parts = valStr.split('.');
    // Add commas to the integer part if length allows
    if (!isNaN(parts[0]) && parts[0] !== '') {
      parts[0] = Number(parts[0]).toLocaleString('en-US');
    }
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  }

  formatExpressionForDisplay(expr) {
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ')
      .replace(/\^/g, ' ^ ');
  }

  handleButtonPress(btn) {
    // Provide visual press feedback
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);

    const val = btn.dataset.val;
    const action = btn.dataset.action;

    if (val !== undefined) {
      this.inputNumberOrDot(val);
      this.playTone(520, 0.03);
    } else if (action) {
      this.handleAction(action, btn);
    }
  }

  inputNumberOrDot(val) {
    if (this.isEvaluated) {
      this.currentVal = '0';
      this.expression = '';
      this.isEvaluated = false;
    }

    if (val === '.') {
      if (!this.currentVal.includes('.')) {
        this.currentVal += '.';
      }
    } else {
      if (this.currentVal === '0') {
        this.currentVal = val;
      } else {
        this.currentVal += val;
      }
    }
    this.updateDisplay();
  }

  handleAction(action, btn) {
    switch (action) {
      case 'clear-all':
        this.clearAll();
        this.playTone(320, 0.06);
        break;

      case 'backspace':
        this.backspace();
        this.playTone(360, 0.04);
        break;

      case 'negate':
        this.negate();
        this.playTone(450, 0.03);
        break;

      case 'percent':
        this.applyPercent();
        this.playTone(450, 0.03);
        break;

      case 'operator':
        const op = btn.dataset.val;
        this.setOperator(op);
        this.playTone(600, 0.04);
        break;

      case 'equals':
        this.calculate();
        this.playTone(720, 0.08);
        break;

      // Scientific actions
      case 'pi':
        this.currentVal = Math.PI.toString();
        this.isEvaluated = false;
        this.updateDisplay();
        this.playTone(500, 0.04);
        break;

      case 'e':
        this.currentVal = Math.E.toString();
        this.isEvaluated = false;
        this.updateDisplay();
        this.playTone(500, 0.04);
        break;

      case 'sqrt':
        this.applySingleFunction('√', (x) => Math.sqrt(x));
        break;

      case 'square':
        this.applySingleFunction('sqr', (x) => Math.pow(x, 2));
        break;

      case 'cube':
        this.applySingleFunction('cube', (x) => Math.pow(x, 3));
        break;

      case 'power':
        this.setOperator('^');
        this.playTone(600, 0.04);
        break;

      case 'sin':
        this.applyTrigFunction('sin', Math.sin);
        break;

      case 'cos':
        this.applyTrigFunction('cos', Math.cos);
        break;

      case 'tan':
        this.applyTrigFunction('tan', Math.tan);
        break;

      case 'asin':
        this.applyInverseTrig('asin', Math.asin);
        break;

      case 'acos':
        this.applyInverseTrig('acos', Math.acos);
        break;

      case 'atan':
        this.applyInverseTrig('atan', Math.atan);
        break;

      case 'log':
        this.applySingleFunction('log', (x) => Math.log10(x));
        break;

      case 'pow10':
        this.applySingleFunction('10^', (x) => Math.pow(10, x));
        break;

      case 'ln':
        this.applySingleFunction('ln', (x) => Math.log(x));
        break;

      case 'exp':
        this.applySingleFunction('exp', (x) => Math.exp(x));
        break;

      case 'fact':
        this.applySingleFunction('fact', (x) => this.factorial(x));
        break;

      case 'abs':
        this.applySingleFunction('abs', (x) => Math.abs(x));
        break;

      case 'open-paren':
        this.inputParenthesis('(');
        break;

      case 'close-paren':
        this.inputParenthesis(')');
        break;
    }
  }

  clearAll() {
    this.expression = '';
    this.currentVal = '0';
    this.isEvaluated = false;
    this.updateDisplay();
  }

  backspace() {
    if (this.isEvaluated) {
      this.clearAll();
      return;
    }
    if (this.currentVal.length > 1) {
      this.currentVal = this.currentVal.slice(0, -1);
    } else {
      this.currentVal = '0';
    }
    this.updateDisplay();
  }

  negate() {
    if (this.currentVal === '0' || this.currentVal === 'Error') return;
    if (this.currentVal.startsWith('-')) {
      this.currentVal = this.currentVal.substring(1);
    } else {
      this.currentVal = '-' + this.currentVal;
    }
    this.updateDisplay();
  }

  applyPercent() {
    const num = parseFloat(this.currentVal);
    if (!isNaN(num)) {
      this.currentVal = this.sanitizePrecision(num / 100).toString();
      this.updateDisplay();
    }
  }

  setOperator(op) {
    if (this.currentVal === 'Error') this.currentVal = '0';

    if (this.isEvaluated) {
      this.expression = this.currentVal + ' ' + op + ' ';
      this.currentVal = '0';
      this.isEvaluated = false;
    } else {
      // If expression ends with an operator and currentVal is '0', replace the operator
      if (this.expression.endsWith(' ') && this.currentVal === '0') {
        this.expression = this.expression.trim().slice(0, -1) + ' ' + op + ' ';
      } else {
        this.expression += this.currentVal + ' ' + op + ' ';
        this.currentVal = '0';
      }
    }
    this.updateDisplay();
  }

  inputParenthesis(p) {
    if (p === '(') {
      if (this.currentVal !== '0') {
        this.expression += this.currentVal + ' * ( ';
      } else {
        this.expression += '( ';
      }
      this.currentVal = '0';
    } else {
      this.expression += this.currentVal + ' ) ';
      this.currentVal = '0';
    }
    this.playTone(450, 0.04);
    this.updateDisplay();
  }

  applySingleFunction(name, fn) {
    const num = parseFloat(this.currentVal);
    if (isNaN(num)) return;
    try {
      const res = fn(num);
      if (isNaN(res) || !isFinite(res)) {
        this.currentVal = 'Error';
      } else {
        this.currentVal = this.sanitizePrecision(res).toString();
      }
    } catch (_) {
      this.currentVal = 'Error';
    }
    this.isEvaluated = true;
    this.playTone(550, 0.04);
    this.updateDisplay();
  }

  applyTrigFunction(name, fn) {
    let num = parseFloat(this.currentVal);
    if (isNaN(num)) return;

    if (this.angleMode === 'DEG') {
      // normalize degrees to prevent floating point remainder issues
      let deg = num % 360;
      if (deg < 0) deg += 360;
      if (name === 'sin' && (deg === 0 || deg === 180 || deg === 360)) {
        this.currentVal = '0';
        this.isEvaluated = true;
        this.updateDisplay();
        return;
      }
      if (name === 'cos' && (deg === 90 || deg === 270)) {
        this.currentVal = '0';
        this.isEvaluated = true;
        this.updateDisplay();
        return;
      }
      if (name === 'tan' && (deg === 90 || deg === 270)) {
        this.currentVal = 'Error';
        this.isEvaluated = true;
        this.updateDisplay();
        return;
      }
      num = (num * Math.PI) / 180;
    }

    try {
      const res = fn(num);
      this.currentVal = isNaN(res) || !isFinite(res) ? 'Error' : this.sanitizePrecision(res).toString();
    } catch (_) {
      this.currentVal = 'Error';
    }
    this.isEvaluated = true;
    this.playTone(550, 0.04);
    this.updateDisplay();
  }

  applyInverseTrig(name, fn) {
    const num = parseFloat(this.currentVal);
    if (isNaN(num)) return;
    try {
      let res = fn(num);
      if (this.angleMode === 'DEG') {
        res = (res * 180) / Math.PI;
      }
      this.currentVal = isNaN(res) || !isFinite(res) ? 'Error' : this.sanitizePrecision(res).toString();
    } catch (_) {
      this.currentVal = 'Error';
    }
    this.isEvaluated = true;
    this.playTone(550, 0.04);
    this.updateDisplay();
  }

  factorial(n) {
    if (n < 0 || n > 170 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  calculate() {
    let fullExpr = this.expression + this.currentVal;
    if (!fullExpr.trim() || fullExpr === '0') return;

    // Balance open parentheses if any
    const openParens = (fullExpr.match(/\(/g) || []).length;
    const closeParens = (fullExpr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      fullExpr += ' )'.repeat(openParens - closeParens);
    }

    try {
      const evaluated = this.safeEvaluate(fullExpr);
      if (isNaN(evaluated) || !isFinite(evaluated)) {
        this.currentVal = 'Error';
      } else {
        const rounded = this.sanitizePrecision(evaluated);
        this.addToHistory(fullExpr, rounded.toString());
        this.currentVal = rounded.toString();
      }
    } catch (err) {
      this.currentVal = 'Error';
    }

    this.expression = fullExpr + ' =';
    this.isEvaluated = true;
    this.updateDisplay();
  }

  // Safe arithmetic evaluator without arbitrary eval()
  safeEvaluate(exprStr) {
    // Replace custom operators
    let sanitized = exprStr
      .replace(/\^/g, '**');

    // Token validation: only allow numbers, math operators, parens, decimal
    if (/[^0-9+\-*/(). eE*]/.test(sanitized)) {
      throw new Error('Invalid characters in expression');
    }

    // Function constructor limited strictly to arithmetic
    const calcFn = new Function(`'use strict'; return (${sanitized})`);
    return calcFn();
  }

  sanitizePrecision(num) {
    if (typeof num !== 'number') return num;
    // Round to max 12 significant digits to avoid 0.1 + 0.2 = 0.30000000000000004
    return parseFloat(num.toPrecision(12));
  }

  // History management
  addToHistory(expr, result) {
    const item = {
      expr: this.formatExpressionForDisplay(expr),
      result: result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.history.unshift(item);
    if (this.history.length > 30) this.history.pop();
    localStorage.setItem('ashCalcHistory', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyList) return;
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<div class="empty-history">No calculations yet</div>';
      return;
    }
    this.historyList.innerHTML = '';
    this.history.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <span class="history-expr">${item.expr} =</span>
        <span class="history-res">${this.formatNumber(item.result)}</span>
      `;
      div.addEventListener('click', () => {
        this.currentVal = item.result;
        this.expression = '';
        this.isEvaluated = false;
        this.updateDisplay();
        this.toggleHistory(false);
      });
      this.historyList.appendChild(div);
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('ashCalcHistory');
    localStorage.removeItem('omniCalcHistory');
    this.renderHistory();
    this.playTone(300, 0.05);
  }

  // Copy to clipboard
  copyToClipboard() {
    const textToCopy = this.currentVal;
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const tooltip = this.copyBtn.querySelector('.copy-tooltip');
      if (tooltip) {
        tooltip.classList.add('show');
        setTimeout(() => tooltip.classList.remove('show'), 1500);
      }
      this.playTone(650, 0.03);
    });
  }

  // Keyboard navigation
  handleKeyboard(e) {
    // If modal/input is active, skip
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key;

    if (!isNaN(key) && key !== ' ') {
      e.preventDefault();
      this.inputNumberOrDot(key);
      this.playTone(520, 0.03);
    } else if (key === '.') {
      e.preventDefault();
      this.inputNumberOrDot('.');
      this.playTone(520, 0.03);
    } else if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      this.setOperator(key);
      this.playTone(600, 0.04);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.calculate();
      this.playTone(720, 0.08);
    } else if (key === 'Backspace') {
      e.preventDefault();
      this.backspace();
    } else if (key === 'Escape') {
      e.preventDefault();
      this.clearAll();
      this.playTone(320, 0.06);
    } else if (key === '(' || key === ')') {
      e.preventDefault();
      this.inputParenthesis(key);
    } else if (key === '%') {
      e.preventDefault();
      this.applyPercent();
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.calculator = new AshCalc();

  // URL query parameter support for direct mode, calculations, or presets
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('theme')) {
    const t = urlParams.get('theme');
    document.body.setAttribute('data-theme', t);
    localStorage.setItem('ashCalcTheme', t);
    const themeIcon = document.getElementById('themeToggleBtn')?.querySelector('.theme-icon');
    if (themeIcon) themeIcon.textContent = t === 'dark' ? '🌙' : '☀️';
  }
  if (urlParams.get('mode') === 'scientific') {
    document.querySelector('[data-mode="scientific"]')?.click();
  }
  if (urlParams.get('calc')) {
    const expr = urlParams.get('calc');
    for (const char of expr) {
      window.calculator.handleKeyboard({ key: char, preventDefault: () => {} });
    }
    window.calculator.handleKeyboard({ key: '=', preventDefault: () => {} });
  }
});
