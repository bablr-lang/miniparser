export declare class Parser {
  spans: Array<{ type: string | symbol; guard: string | RegExp }>;
  eat(value: string | RegExp): string;
  eatMatch(value: string | RegExp): string | null;
  match(value: string | RegExp): string | null;
  eatProduction<T extends string | symbol>(type: T): any;
  done: boolean;
  node<T>(value: T): { type: string | symbol; value: any };
}

export declare function templateParse(
  grammar: Grammar,
  type: string | symbol,
  literals: Array<string>,
  ...quasis: Array<any>
): any;

export declare function parse(grammar: Grammar, source: string, type: string | symbol): any;

export declare function print(grammar: Grammar, node: string, type: string | symbol): any;
