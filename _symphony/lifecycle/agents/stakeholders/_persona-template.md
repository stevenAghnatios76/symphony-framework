---
id: _persona-template
name: Stakeholder Persona Template
type: abstract
max_lines: 60
---

<persona-schema>
  <description>Abstract template for stakeholder personas. Each concrete persona defines a role that agents can adopt during stakeholder review workflows (create-stakeholder, adversarial-review).</description>
  <required-elements>
    <element name="background">Professional background, responsibilities, and domain expertise</element>
    <element name="priorities">Ordered list of what this stakeholder cares most about</element>
    <element name="concerns">Risk perspective — what worries this stakeholder</element>
    <element name="review-lens">Specific questions this stakeholder asks when reviewing work</element>
    <element name="communication-style">How this stakeholder prefers to receive information</element>
  </required-elements>
</persona-schema>
