# @bablr/miniparser

The miniparser is a small parser core which is used to bootstrap parts of `@bablr/vm`. Supports lexical spans, span guards, and template string interpolation. Designed to be used with [@bablr/grammar](https://github.com/bablr-lang/grammar).

Does not support ambiguous languages, or yield-based grammars. Sync only. Using this tool is very much just hand-writing a parser.
