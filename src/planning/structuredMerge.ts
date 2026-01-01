/**
 * Structured merge of planning outputs without LLM
 */

import { writeFile } from "fs/promises";

/**
 * Merge planning outputs WITHOUT using LLM
 * Deterministic extraction and combination
 */
export async function structuredMerge(
  spec: string,
  arch: string,
  qa: string,
  outputFile: string
): Promise<void> {
  const requirements = extractSection(spec, "## Requirements", "##");
  const acceptance = extractSection(spec, "## Acceptance", "##");
  const design = extractSection(arch, "## Design", "##");
  const api = extractSection(arch, "## API", "##");
  const testPlan = extractSection(qa, "## Test Plan", "##");
  const risks = extractSection(qa, "## Risks", "##");
  
  const merged = `# Unified Implementation Plan

> Auto-generated from parallel planning agents. No LLM used for merge.

---

## 1. Requirements

${requirements}

---

## 2. Acceptance Criteria

${acceptance}

---

## 3. Architecture Design

${design}

---

## 4. API & Data Models

${api}

---

## 5. Test Plan

${testPlan}

---

## 6. Risks & Mitigations

${risks}

---

## 7. Implementation Steps

${synthesizeSteps(spec, arch)}

---

Generated: ${new Date().toISOString()}
`;

  await writeFile(outputFile, merged, "utf-8");
}

function extractSection(
  doc: string,
  startMarker: string,
  endPrefix: string
): string {
  const lines = doc.split("\n");
  const startIdx = lines.findIndex(l => 
    l.toLowerCase().includes(startMarker.toLowerCase())
  );
  
  if (startIdx === -1) {
    return "_Section not found in planning output_";
  }
  
  // Find next section or end
  let endIdx = lines.findIndex((l, i) => 
    i > startIdx && 
    l.startsWith(endPrefix) && 
    !l.toLowerCase().includes(startMarker.toLowerCase())
  );
  
  if (endIdx === -1) endIdx = lines.length;
  
  const section = lines.slice(startIdx + 1, endIdx);
  return section.join("\n").trim() || "_Empty section_";
}

function synthesizeSteps(spec: string, arch: string): string {
  const specSteps = extractNumberedList(spec);
  const archSteps = extractNumberedList(arch);
  
  // Combine and deduplicate
  const allSteps = [...specSteps, ...archSteps];
  const unique = [...new Set(allSteps)].filter(s => s.length > 0);
  
  if (unique.length === 0) {
    return "1. Review requirements\n2. Implement core functionality\n3. Add tests\n4. Review and refactor";
  }
  
  return unique.map((step, i) => `${i + 1}. ${step}`).join("\n");
}

function extractNumberedList(doc: string): string[] {
  return doc
    .split("\n")
    .filter(l => /^\s*\d+\.\s/.test(l))
    .map(l => l.replace(/^\s*\d+\.\s*/, "").trim());
}

