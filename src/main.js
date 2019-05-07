// Defaults
const defaultOptions = {
  interval: 0,
  duration: 500,
  cursor: null,
  loop: false,
  deliminator: null,
  fps: null,
  autoplay: true,
  endPromptClass: null,
  startPromptClass: null,
}

// Shared Variables
let prompters = [];
let listening = false;
let wHeight = window.innerHeight;

// Exported Controller
const controller = {
  play(string) {
    Array.from(prompters).forEach(prompter => {
      if (prompter.elem.classList.contains(string) || prompter.elem.id === string) {
        prompter.reset();
        prompter.play();
      }
    })
  },

  stop(string) {
    Array.from(prompters).forEach(prompter => {
      if (prompter.elem.classList.contains(string) || prompter.elem.id === string) {
        prompter.stop();
      }
    })
  }
}

// Object Class
class PromptObj {
  constructor(elem, content = null, options = {}) {
    this.elem = elem;
    this.options = {...defaultOptions, ...options};
    this.content = this.parseContent(content);
    this.span = document.createElement('span');
    this.span.style.opacity = 0;
    this.elem.appendChild(this.span);
    this.reset();
    this.initContent();
    if (this.options.autoplay) this.play();
  }

  play() {
    if (!this.running && !this.complete && this.isVisible()) this.prompt();
  }

  stop() {
    this.complete = true;
  }

  reset() {
    this.index = 0;
    this.complete = false;
  }

  initContent() {
    this.elem.innerHTML = '';
    this.string = this.content[this.index];
    this.string = this.string.split('');
    this.span.innerHTML = this.string.join('');
    this.elem.appendChild(this.span);
  }

  prompt() {
    this.running = true;
    this.initContent();

    if (this.options.endPromptClass) this.elem.classList.remove(this.options.endPromptClass);
    if (this.options.startPromptClass) this.elem.classList.add(this.options.startPromptClass);

    requestAnimationFrame((timestamp) => {
      this.frameController(timestamp);
    })

    this.updateIndex();
  }

  frameController(timestamp) {
    if (!this.start) this.start = timestamp;
    let runtime = timestamp - this.start;
    let progress = Math.min(runtime / this.options.duration, 1);

    const splice = Math.ceil(linearInterpolation(0, this.string.length, progress));
    if (!this.splice) this.splice = splice;

    if (this.splice !== splice) {
      const visible = this.string.slice(0, splice);
      const hidden = this.string.slice(splice);

      if (visible.length < this.string.length && this.options.cursor) {
        visible.push(this.options.cursor);
        hidden.shift();
      }

      this.elem.innerHTML = visible.join('');
      this.span.innerHTML = hidden.join('');
      this.elem.appendChild(this.span);
      this.splice = null;
    }

    if (progress < 1) {
      if (this.options.fps) {
        setTimeout(() => requestAnimationFrame((timestamp) => this.frameController(timestamp)), 1000 / this.options.fps)
      } else {
        requestAnimationFrame((timestamp) => this.frameController(timestamp));
      }
    } else {
      this.elem.innerHTML = this.string.join('');
      this.start = null;
      if (this.options.endPromptClass) this.elem.classList.add(this.options.endPromptClass);
      if (this.options.startPromptClass) this.elem.classList.remove(this.options.startPromptClass);
      setTimeout(() => {
        this.running = false;
        this.play();
      }, this.options.interval);
    }
  }

  updateIndex() {
    this.index = this.index + 1;
    if (this.index >= this.content.length) {
      this.reset();
      this.index = 0;
      this.complete = this.options.loop ? false : true;
    }
  }

  // Object Helpers
  parseContent(content) {
    if (Array.isArray(content)) {
      return content;
    }

    let contentArr = [];
    content = content ? content : this.elem.innerHTML;

    if (this.options.deliminator) {
      let values = content.split(this.options.deliminator);
      Array.from(values).forEach(value => contentArr.push(value));
      return contentArr;
    }

    contentArr.push(content);
    return contentArr;
  }

  isVisible() {
    const rect = this.elem.getBoundingClientRect();
    return rect.top < wHeight && rect.bottom > 0;
  }
}

// Listeners
const initListeners = () => {
  window.addEventListener('resize', () => {
    wWidth = window.innerWidth;
    wHeight = window.innerHeight;
    playVisible();
  })

  window.addEventListener('scroll', () => {
    playVisible();
  })
}

// Helpers
const makePromptObj = (target, content, options) => {
  const prompter = new PromptObj(target, content, options);
  prompters.push(prompter);
}

const playVisible = () => {
  Array.from(prompters).forEach(prompter => {
    if (prompter.options.autoplay) prompter.play();
  })
}

const linearInterpolation = (min, max, k) => {
  return min + (max - min) * k;
}

// Export
export default (target, content = null, options = {}) => {
  if (typeof(target) === 'string') {
    target = document.querySelectorAll(`${target}`);
  }

  if (target.length <= 0) return false;

  if (target) {
    if (target.length) {
      Array.from(target).forEach(elem => {
        makePromptObj(elem, content, options);
      })
    } else {
      makePromptObj(elem, content, options);
    }

    if (!listening) {
      initListeners();
      listening = true;
    }

    return controller;
  }
}
