# @bablr/miniparser

The miniparser is a small parser core which is used to bootstrap parts of `@bablr/vm`. Supports lexical spans, span guards, and template string interpolation. Designed to be used with [@bablr/grammar](https://github.com/bablr-lang/grammar).

Does not support ambiguous languages, streaming sources, or BABLR grammars. Using this tool is very much just hand-writing a parser.
