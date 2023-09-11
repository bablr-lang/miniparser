import { isObject } from 'iter-tools-es';
import arrayLast from 'iter-tools-es/methods/array-last';
import isString from 'iter-tools-es/methods/is-string';
import isArray from 'iter-tools-es/methods/is-array';

const { getPrototypeOf } = Object;

const miniprinterGrammar = Symbol.for('@bablr/grammars/miniprinter');

const getNode = (node, options) => {
  return options.monomorphic ? node.value : node;
};

export const defaultOptions = {
  monomorphic: true,
};

class Path {
  static from(node) {
    return new Path(node.type, node);
  }

  constructor(type, node, parent = null, parentProperty = null) {
    this.type = type;
    this.node = node;
    this.parent = parent;
    this.parentProperty = parentProperty;
  }
}

export class Printer {
  constructor(language, path, options = defaultOptions) {
    this.langauges = [];
    this.spans = [{ type: 'Bare', guard: undefined }];
    this.path = path;
    this.result = '';
    this.options = Object.freeze(Object.seal(options));

    this.pushLanguage(language);
  }

  eatProduction(...args) {
    let { type } = this.path.node;
    let props = {};
    if (isString(args[0])) {
      ({ 0: type, 1: props = props } = args);
    } else if (isObject(args[0])) {
      ({ 0: props } = args);
    } else {
      throw new Error('arguments invalid');
    }

    const { grammar, path, options } = this;
    const property = props.path;
    if (property) {
      const child = getNode(this.path.node[property], options);
      if (!child) throw new Error('cannot print nothing');
      if (isArray(child)) {
        throw new Error('implement resolvers or something');
      }

      // TODO don't just trust props.path but also check Node cover
      this.path = new Path(child.type, child, path, property);
      ({ type } = this.path);
    }
    const result = getPrototypeOf(grammar)[type].call(grammar, this, this.path);

    if (property) {
      this.path = this.path.parent;
    }

    return result;
  }

  get language() {
    return arrayLast(this.langauges).language;
  }

  get grammar() {
    return arrayLast(this.langauges).grammar;
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
    this.langauges.push({ language, grammar: new language.grammars[miniprinterGrammar]() });
  }

  popLanguage() {
    if (!this.langauges.length) {
      throw new Error('no language to pop');
    }
    this.langauges.pop();
  }

  replaceSpan(span) {
    this.spans.pop();
    this.spans.push(span);
  }
}

export const print = (language, node, type = node.type, options = defaultOptions) => {
  const printer = new Printer(language, Path.from(getNode(node, options)), options);

  printer.eatProduction(type);

  return printer.result;
};
