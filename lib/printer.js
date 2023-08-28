import { arrayLast } from './util.js';

const { getPrototypeOf } = Object;

const miniprinterGrammar = Symbol.for('@bablr/grammars/miniprinter');

export class Printer {
  constructor(language, options = {}) {
    this.grammars = [];
    this.spans = [{ type: 'Bare', guard: undefined }];
    this.node = null;
    this.type = null;
    this.result = '';
    this.options = Object.freeze(Object.seal(options));

    this.pushLanguage(language);
  }

  eatProduction(node, type = node.type) {
    const { grammar } = this;
    return getPrototypeOf(grammar)[type].call(grammar, this, node);
  }

  get grammar() {
    return arrayLast(this.grammars);
  }

  get span() {
    return arrayLast(this.spans);
  }

  print(chrs) {
    this.result += chrs;
  }

  pushSpan(span) {
    this.spans.push(span);
  }

  popSpan() {
    if (!this.spans.length) {
      throw new Error('no span to pop');
    }
    this.spans.pop();
  }

  pushLanguage(language) {
    this.grammars.push(new language.grammars[miniprinterGrammar]());
  }

  popLanguage() {
    if (!this.grammars.length) {
      throw new Error('no grammar to pop');
    }
    this.grammars.pop();
  }

  replaceSpan(span) {
    this.spans.pop();
    this.spans.push(span);
  }
}

export const print = (grammar, node, type = node.type) => {
  const printer = new Printer(grammar);

  printer.eatProduction(node, type);

  return printer.result;
};
