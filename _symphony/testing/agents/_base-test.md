---
id: _base-test
name: Base Test Template
type: abstract
max_lines: 180
---

<base-test id="_base-test" type="abstract">
  <purpose>Abstract template inherited by all testing agents. Defines shared test strategy protocol, coverage tracking, adapter selection, and quality gates. Never instantiated directly.</purpose>

  <test-strategy-protocol>
    <step n="1" title="ANALYZE">
      Assess the codebase. Identify testable components. Review existing test coverage and known gaps. Load relevant knowledge fragments from _symphony/testing/knowledge/.
    </step>
    <step n="2" title="DESIGN">
      Define test strategy. Select appropriate test pyramid layers (unit, integration, e2e). Set coverage targets per component based on risk assessment.
    </step>
    <step n="3" title="WRITE">
      Write tests following TDD (red-green-refactor). Start with a failing test that describes expected behavior. Write minimum code to pass. Refactor while green.
    </step>
    <step n="4" title="EXECUTE">
      Run tests using the appropriate adapter from _symphony/testing/adapters/. Collect pass/fail/skip results and coverage metrics.
    </step>
    <step n="5" title="REPORT">
      Generate structured report: pass/fail/skip counts, coverage metrics (line, branch, critical path), failures with root cause annotations.
    </step>
    <step n="6" title="ITERATE">
      Analyze failures. Refine tests. Add missing edge cases. Repeat until coverage targets are met and all critical paths are verified.
    </step>
  </test-strategy-protocol>

  <coverage-tracking>
    Track coverage metrics per component. Format each entry as YAML:
      component: {name}
      line_coverage: {current_pct}
      branch_coverage: {current_pct}
      critical_path_coverage: {current_pct}
      target: {target_pct}
    Update after each EXECUTE step. Flag components below target for the next ITERATE cycle.
  </coverage-tracking>

  <adapter-selection>
    Detect project stack by checking for marker files at project root:
      package.json       -> _symphony/testing/adapters/vitest-adapter
      pyproject.toml     -> _symphony/testing/adapters/pytest-adapter
      setup.py           -> _symphony/testing/adapters/pytest-adapter
      requirements.txt   -> _symphony/testing/adapters/pytest-adapter
      go.mod             -> _symphony/testing/adapters/go-test-adapter
      pubspec.yaml       -> _symphony/testing/adapters/flutter-test-adapter
      *.xcodeproj        -> _symphony/testing/adapters/xctest-adapter
      Package.swift      -> _symphony/testing/adapters/xctest-adapter
    Load the first matching adapter. Adapter provides run commands, coverage parsers, and output formatters.
  </adapter-selection>

  <knowledge-loading>
    Knowledge fragments are loaded JIT from _symphony/testing/knowledge/. Load by category (strategies, frameworks, patterns, performance, security, mobile) when the workflow context requires it. Drop after use to stay within context budget.
  </knowledge-loading>

  <quality-gates>
    <pre-start>
      - Test plan exists or is being created
      - Project stack detected and adapter available
      - Coverage targets defined for critical components
    </pre-start>
    <post-complete>
      - Coverage targets met for all critical components
      - All tests passing (zero unexpected failures)
      - Structured test report generated
      - Findings logged for out-of-scope issues
    </post-complete>
  </quality-gates>

  <risk-assessment>
    Prioritize testing by component risk. Evaluate each component on:
      - Data loss potential (can this destroy user data?)
      - Security exposure (authentication, authorization, input validation)
      - User-facing impact (visible errors, broken workflows)
      - Integration boundaries (API contracts, third-party dependencies)
    Assign risk category: critical, high, medium, low.
    Critical and high components get coverage targets >= 90%. Medium >= 70%. Low >= 50%.
  </risk-assessment>
</base-test>
