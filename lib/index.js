import { isString, isRegex, arrayLast } from './object.js';
import { escapeRegex } from './regex.js';

const node = Symbol.for('@bablr/node');

const matchSticky = (pattern, { slicedLiteral }) => {
  if (isString(pattern)) {
    return slicedLiteral.startsWith(pattern) ? pattern : null;
  } else if (isRegex(pattern)) {
    if (!pattern.sticky) throw new Error('be sticky!');
    pattern.lastIndex = 0;

    const result = pattern.exec(slicedLiteral);

    return result ? result[0] : null;
  } else {
    throw new Error(`Unknown pattern type`);
  }
};

class TemplateParser {
  constructor(grammar, literals, quasis) {
    this.grammars = [grammar];
    this.spans = [{ type: 'Bare', guard: undefined }];
    this.literals = literals;
    this.quasis = quasis;
    this.literalIdx = 0;
    this.quasiIdx = 0;
    this.idx = 0;
  }

  eatProduction(type) {
    if (this.literalDone) {
      if (this.done) {
        throw new Error('umm');
      } else {
        const { quasi } = this;
        this.quasiIdx++;
        this.literalIdx++;
        this.idx = 0;
        return quasi;
      }
    } else {
      const result = this.grammar.get(type).value(this);

      return this.grammar.is(node, type) ? { type, value: result } : result;
    }
  }

  get literal() {
    return this.literals[this.literalIdx];
  }

  get quasi() {
    return this.quasis[this.quasiIdx];
  }

  get literalDone() {
    return !this.slicedLiteral.length;
  }

  get grammar() {
    return arrayLast(this.grammars);
  }

  get span() {
    return arrayLast(this.spans);
  }

  get done() {
    return this.literalDone && this.literalIdx >= this.literals.length - 1;
  }

  get chr() {
    return this.literal[this.idx];
  }

  get slicedLiteral() {
    const { idx, span, literal } = this;
    const { guard } = span;
    let slicedLiteral = literal.slice(idx);

    if (guard) {
      slicedLiteral = new RegExp(`.*?(?=${escapeRegex(guard)})`).exec(slicedLiteral)?.[0] || '';
    }

    return slicedLiteral;
  }

  eval(type) {
    return this.grammar.get(type).value(this);
  }

  eat(pattern) {
    const result = matchSticky(pattern, this);

    if (!result) throw new Error('miniparser: parsing failed');

    this.idx += result.length;

    return result;
  }

  match(pattern) {
    return matchSticky(pattern, this);
  }

  eatMatch(pattern) {
    const result = matchSticky(pattern, this);
    if (result) {
      this.idx += result.length;
    }
    return result;
  }
}

export const templateParse = (grammar, type, literals, ...quasis) => {
  return new TemplateParser(grammar, literals, quasis).eval(type);
};
