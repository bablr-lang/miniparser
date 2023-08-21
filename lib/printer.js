import { arrayLast } from './util.js';

export class Printer {
  constructor(grammar, options = {}) {
    this.grammars = [grammar];
    this.spans = [{ type: 'Bare', guard: undefined }];
    this.node = null;
    this.type = null;
    this.result = '';
    this.options = Object.freeze(Object.seal(options));
  }

  eatProduction(node, type = node.type) {
    const type_ = this.type;
    const node_ = this.node;
    this.type = type;
    this.node = node;
    const result = this.grammar.get(type).value(this);
    this.type = type_;
    this.node = node_;
    return result;
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
