# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.1] - 2026-11-13

### Fixed

- Replace deprecated Grafana layout classes in the query and variable editors.

## [3.1.0] - 2026-11-13

### Changed

- On Chaos Mesh Dashboard 2.8.9 and later stable releases, fetch events for all selected filter values in one request. The limit applies to the newest matching events across all selections. [#69](https://github.com/chaos-mesh/datasource/pull/69)
- Lower the minimum supported Grafana version to 10.0.0.

## [3.0.0] - 2023-12-18

### Changed

Deprecate Angular support. Refer to [#55](https://github.com/chaos-mesh/datasource/issues/55) for more details.
Please also read the README for new information.

## [2.2.3] - 2022-08-07

### Fixed

- Update the outdated annotations screenshot.

## [2.2.2] - 2022-07-31

### Changed

Ready for submission to grafana official plugins repository. 🥰

## [2.2.1] - 2022-07-28

### Fixed

- Clone the annotation query before using it, which prevents mutating the original value if you use a variable in annotations.
- Reset the `kind` field to `input` in annotations, which allows you to use variables in the kind field, such as `$kind`.

## [2.2.0] - 2022-06-24

### Added

- Allow to specify a limit on the number of events for all queries in the settings
- Add `Workflow` metric to the Variables

### Changed

- Optimize the display of annotations

### Fixed

- Allow the `query string` to be specified in the Variables Query

## [2.1.0] - 2021-09-16

### Changed

- Compatible with Chaos Mesh 2.x (**after 2.0.x, will start with 2.1.x**).
- Bump the minimal grafana version to 7.0.0
- Bump grafana/toolkit to 8.x

## [0.2.2] - 2021-04-15

### Changed

- Allow custom value in the select field

## [0.2.0] - 2021-03-09

### Added

- Displaying Chaos events in a table visualization
- Support [Variables](https://grafana.com/docs/grafana/latest/variables/) to filter Chaos events
- Support [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/) to annotate Chaos events on the panel

[Unreleased]: https://github.com/chaos-mesh/datasource/compare/v3.1.1...release-3.x
[3.1.1]: https://github.com/chaos-mesh/datasource/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/chaos-mesh/datasource/compare/v3.0.0...v3.1.0
