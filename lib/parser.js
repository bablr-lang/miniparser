import escapeRegex from 'escape-string-regexp';
import { arrayLast, isString, isRegex, isArray } from './util.js';
import * as sym from './symbols.js';

const isList = (obj) => isArray(obj) || Symbol.iterator in obj;

const { getPrototypeOf } = Object;

const miniparserGrammar = Symbol.for('@bablr/grammars/miniparser');

export const defaultOptions = {
  monomorphic: true,
};

export class TemplateParser {
  constructor(language, literals, quasis, options = defaultOptions) {
    this.grammars = [];
    this.spans = [{ type: 'Bare', guard: null }];
    this.literals = literals;
    this.quasis = quasis;
    this.literalIdx = 0;
    this.quasiIdx = 0;
    this.idx = 0;
    this.type = null;
    this.options = Object.freeze(Object.seal(options));

    this.pushLanguage(language);
  }

  eatProduction(type) {
    const { aliases } = this.grammar;

    if (this.atQuasi && aliases.get(sym.node).has(type)) {
      const { quasi, literalsDone } = this;

      if (literalsDone) throw new Error('there must be more literals than quasis');

      this.quasiIdx++;
      this.literalIdx++;
      this.idx = 0;
      return quasi;
    } else {
      return this.eval(type);
    }
  }

  eatProductions(type) {
    const { aliases } = this.grammar;

    if (this.atQuasi && aliases.get(sym.node).has(type)) {
      const { quasi, literalsDone } = this;

      if (literalsDone) throw new Error('there must be more literals than quasis');

      this.quasiIdx++;
      this.literalIdx++;
      this.idx = 0;
      return isList(quasi) ? (isArray(quasi) ? quasi : [...quasi]) : [quasi];
    } else {
      return [this.eval(type)];
    }
  }

  get literal() {
    return this.literals[this.literalIdx];
  }

  get quasi() {
    return this.quasis[this.quasiIdx];
  }

  get quasisDone() {
    return this.quasiIdx >= this.quasis.length;
  }

  get atQuasi() {
    return !this.slicedLiteral.length && !this.quasisDone;
  }

  get done() {
    return !this.guardedSlicedLiteral.length && !this.atQuasi;
  }

  get literalsDone() {
    return this.literalIdx >= this.literals.length;
  }

  get grammar() {
    return arrayLast(this.grammars);
  }

  get span() {
    return arrayLast(this.spans);
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

    if (!guard) return slicedLiteral;

    const pat = new RegExp(escapeRegex(guard), 'y');
    const res = pat.exec(slicedLiteral);

    return res ? slicedLiteral.slice(0, pat.lastIndex - res[0].length) : slicedLiteral;
  }

  eval(type) {
    const { aliases } = this.grammar;

    if (!type) throw new Error('eval requires a type');

    const { grammar } = this;

    const result = getPrototypeOf(grammar)[type].call(grammar, this);

    const isNode = aliases.get(sym.node).has(type) && !aliases.has(type);

    return isNode ? this.node(type, result) : result;
  }

  node(type, value) {
    const { monomorphic } = this.options;
    return monomorphic ? { type, value } : { type, ...value };
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

  chuck(chrs) {
    for (const chr of chrs) {
      if (this.literal[this.idx - 1] !== chr) {
        throw new Error('cannot chuck: chr not found');
      }
      this.idx--;
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

  pushLanguage(language) {
    this.grammars.push(new language.grammars[miniparserGrammar]());
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

export const buildTag =
  (grammar, type, options = defaultOptions) =>
  (literals, ...quasis) => {
    return new TemplateParser(grammar, literals, quasis, options).eval(type);
  };

export const parse = (grammar, source, type, options = defaultOptions) => {
  return new TemplateParser(grammar, [source], [], options).eval(type);
};
