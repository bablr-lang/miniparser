import escapeRegex from 'escape-string-regexp';
import { arrayLast, isString, isRegex } from './util.js';

export class TemplateParser {
  constructor(grammar, literals, quasis, options = {}) {
    this.grammars = [grammar];
    this.spans = [{ type: 'Bare', guard: null }];
    this.literals = literals;
    this.quasis = quasis;
    this.literalIdx = 0;
    this.quasiIdx = 0;
    this.idx = 0;
    this.type = null;
    this.options = Object.freeze(Object.seal(options));
  }

  eatProduction(type) {
    if (this.done) {
      if (this.literalsDone) {
        throw new Error('umm');
      } else {
        const { quasi } = this;
        this.quasiIdx++;
        this.literalIdx++;
        this.idx = 0;
        return quasi;
      }
    } else {
      const type_ = this.type;
      this.type = type;
      const result = this.grammar.get(type).value(this);
      this.type = type_;
      return result;
    }
  }

  get literal() {
    return this.literals[this.literalIdx];
  }

  get quasi() {
    return this.quasis[this.quasiIdx];
  }

  get done() {
    return !this.guardedSlicedLiteral.length;
  }

  get literalsDone() {
    return this.literalIdx >= this.literals.length - 1;
  }

  get grammar() {
    return arrayLast(this.grammars);
  }

  get span() {
    return arrayLast(this.spans);
  }

  get allDone() {
    return this.done && this.literalsDone;
  }

  get chr() {
    return this.literal[this.idx];
  }

  get slicedLiteral() {
    const { idx, literal } = this;
    return literal.slice(idx);
  }

  get guardedSlicedLiteral() {
    const { span, slicedLiteral } = this;
    const { guard } = span;

    return guard
      ? new RegExp(`.*?(?=${escapeRegex(guard)})`).exec(slicedLiteral)?.[0] || ''
      : slicedLiteral;
  }

  eval(type) {
    this.type = type;
    return this.grammar.get(type).value(this);
  }

  matchSticky(pattern, props) {
    const { slicedLiteral, guardedSlicedLiteral } = this;
    const { endSpan } = props;

    const source = endSpan ? slicedLiteral : guardedSlicedLiteral;

    if (isString(pattern)) {
      return source.startsWith(pattern) ? pattern : null;
    } else if (isRegex(pattern)) {
      if (!pattern.sticky) throw new Error('be sticky!');
      pattern.lastIndex = 0;

      const result = pattern.exec(source);

      return result ? result[0] : null;
    } else {
      throw new Error(`Unknown pattern type`);
    }
  }

  updateSpans(props) {
    const { startSpan, endSpan, balanced } = props;
    if (startSpan || balanced) {
      const type = startSpan || this.span.type;
      this.pushSpan({ type, guard: balanced });
    } else if (endSpan) {
      if (!this.span.guard) {
        throw new Error('Only balanced spans can be closed with endSpan');
      }
      this.popSpan();
    }
  }

  eat(pattern, props = {}) {
    const result = this.matchSticky(pattern, props, this);

    if (!result) throw new Error('miniparser: parsing failed');

    this.updateSpans(props);

    this.idx += result.length;

    return result;
  }

  match(pattern, props = {}) {
    return this.matchSticky(pattern, props, this);
  }

  eatMatch(pattern, props = {}) {
    const result = this.matchSticky(pattern, props, this);
    if (result) {
      this.updateSpans(props);

      this.idx += result.length;
    }
    return result;
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

  node(value) {
    const { type, options } = this;
    return options.monomorphic ? { type, value } : { type, ...value };
  }
}

export const buildTag =
  (grammar, type) =>
  (literals, ...quasis) => {
    return new TemplateParser(grammar, literals, quasis).eval(type);
  };

export const parse = (grammar, source, type) => {
  return new TemplateParser(grammar, [source], []).eval(type);
};
