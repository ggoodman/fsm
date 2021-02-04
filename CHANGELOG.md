# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased
### Added
- Added a changelog (this very file 💥) and functionality to produce GitHub releases.

### Fixed
- Fixed case where events (via `ctx.send()`) and transitions (via `ctx.transitionTo()`) were processed even when the context on which they were fired was invalidated. A context is invalidated as soon as a transition to another state happens.
  
  Right now these invocations are silently ignored. It may be worth considering making a 'strict' mode where calling such context methods generates a form of warning or error.
