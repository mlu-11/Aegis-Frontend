// Compares by ID first, then by name+type, so it stays stable even if some IDs change.

// Detects:

// added elements

// deleted elements

// modified elements (renamed, changed endpoints for sequence flows, etc.)

// Returns differenceCost > 0 for anything “modified”, which we’ll use for highlighting.

// Your existing components already import compareBpmnXml, BPMNElement, and ComparisonResult, so this stays API-compatible.

export interface BPMNElement {
  id: string;
  name: string;
  type: string;
  incoming: string[];
  outgoing: string[];
  sourceRefId?: string; // for sequenceFlow
  targetRefId?: string; // for sequenceFlow
}

export interface ElementPair {
  first: BPMNElement | null; // element in source
  second: BPMNElement | null; // element in target
  differenceCost: number;
}

export interface ComparisonResult {
  penalty: number;
  matchingSet: ElementPair[];
  addedSet: ElementPair[];
  deletedSet: ElementPair[];
}

/**
 * Parse BPMN XML into a map of BPMNElement by id.
 * Uses DOMParser in the browser.
 */
function parseBpmnElements(xml: string): Map<string, BPMNElement> {
  if (!xml) return new Map();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const allNodes = Array.from(doc.getElementsByTagName("*"));

  const elements = new Map<string, BPMNElement>();

  // First pass: collect BPMN semantic elements
  for (const node of allNodes) {
    const id = node.getAttribute("id");
    if (!id) continue;

    const ns = node.namespaceURI || "";
    const localName = node.localName || node.tagName;

    // ignore DI / diagram stuff
    if (ns.toLowerCase().includes("bpmndi")) continue;
    if (ns.toLowerCase().includes("dc")) continue;
    if (ns.toLowerCase().includes("di")) continue;

    // we only care about “real” BPMN elements
    const interestingLocalNames = new Set([
      "process",
      "task",
      "userTask",
      "serviceTask",
      "manualTask",
      "businessRuleTask",
      "scriptTask",
      "sendTask",
      "receiveTask",
      "subProcess",
      "callActivity",
      "startEvent",
      "endEvent",
      "intermediateThrowEvent",
      "intermediateCatchEvent",
      "boundaryEvent",
      "exclusiveGateway",
      "inclusiveGateway",
      "parallelGateway",
      "sequenceFlow",
    ]);

    if (!interestingLocalNames.has(localName)) continue;

    const name = node.getAttribute("name") || "";
    const normalizedType = `bpmn:${localName}`;

    const elem: BPMNElement = {
      id,
      name,
      type: normalizedType,
      incoming: [],
      outgoing: [],
    };

    // for sequenceFlow we keep endpoints
    if (localName === "sequenceFlow") {
      elem.sourceRefId = node.getAttribute("sourceRef") || undefined;
      elem.targetRefId = node.getAttribute("targetRef") || undefined;
    }

    elements.set(id, elem);
  }

  // Second pass: wire incoming/outgoing based on sequenceFlows
  for (const elem of elements.values()) {
    if (elem.type !== "bpmn:sequenceFlow") continue;
    const flowId = elem.id;
    const sourceId = elem.sourceRefId;
    const targetId = elem.targetRefId;

    if (sourceId && elements.has(sourceId)) {
      elements.get(sourceId)!.outgoing.push(flowId);
    }
    if (targetId && elements.has(targetId)) {
      elements.get(targetId)!.incoming.push(flowId);
    }
  }

  return elements;
}

/**
 * Very simple name-difference cost (0 = same, up to 1 = very different).
 */
function nameDifference(a: string, b: string): number {
  const aTrim = (a || "").trim().toLowerCase();
  const bTrim = (b || "").trim().toLowerCase();
  if (!aTrim && !bTrim) return 0;
  if (aTrim === bTrim) return 0;
  const maxLen = Math.max(aTrim.length, bTrim.length);
  const minLen = Math.min(aTrim.length, bTrim.length);
  return (maxLen - minLen) / Math.max(1, maxLen);
}

/**
 * Compute how different two elements are.
 * 0 means identical; higher means more different.
 */
function elementDifferenceCost(a: BPMNElement, b: BPMNElement): number {
  let cost = 0;

  if (a.type !== b.type) {
    cost += 1;
  }

  // name difference
  cost += nameDifference(a.name, b.name);

  // sequenceFlow structural change
  if (a.type === "bpmn:sequenceFlow" && b.type === "bpmn:sequenceFlow") {
    if (a.sourceRefId !== b.sourceRefId) cost += 0.75;
    if (a.targetRefId !== b.targetRefId) cost += 0.75;
  }

  // small penalty if number of incoming/outgoing differs
  if (a.incoming.length !== b.incoming.length) cost += 0.25;
  if (a.outgoing.length !== b.outgoing.length) cost += 0.25;

  return cost;
}

export function compareBpmnXml(
  sourceXml: string,
  targetXml: string
): ComparisonResult {
  const sourceMap = parseBpmnElements(sourceXml);
  const targetMap = parseBpmnElements(targetXml);

  const usedSource = new Set<string>();
  const usedTarget = new Set<string>();

  const matchingSet: ElementPair[] = [];
  const addedSet: ElementPair[] = [];
  const deletedSet: ElementPair[] = [];

  // 1) exact ID matches
  for (const [id, targetElem] of targetMap.entries()) {
    if (sourceMap.has(id)) {
      const sourceElem = sourceMap.get(id)!;
      const diffCost = elementDifferenceCost(sourceElem, targetElem);
      matchingSet.push({
        first: sourceElem,
        second: targetElem,
        differenceCost: diffCost,
      });
      usedSource.add(id);
      usedTarget.add(id);
    }
  }

  // 2) name+type matches for remaining elements (handles changed IDs)
  for (const [targetId, targetElem] of targetMap.entries()) {
    if (usedTarget.has(targetId)) continue;

    let bestSourceId: string | null = null;
    let bestCost = Number.POSITIVE_INFINITY;

    for (const [sourceId, sourceElem] of sourceMap.entries()) {
      if (usedSource.has(sourceId)) continue;
      if (sourceElem.type !== targetElem.type) continue;
      if (!sourceElem.name || !targetElem.name) continue;
      if (
        sourceElem.name.trim().toLowerCase() !==
        targetElem.name.trim().toLowerCase()
      ) {
        continue;
      }

      const cost = elementDifferenceCost(sourceElem, targetElem);
      if (cost < bestCost) {
        bestCost = cost;
        bestSourceId = sourceId;
      }
    }

    if (bestSourceId) {
      const sourceElem = sourceMap.get(bestSourceId)!;
      const diffCost = elementDifferenceCost(sourceElem, targetElem);
      matchingSet.push({
        first: sourceElem,
        second: targetElem,
        differenceCost: diffCost,
      });
      usedSource.add(bestSourceId);
      usedTarget.add(targetId);
    }
  }

  // 3) remaining source elements → deleted
  for (const [id, sourceElem] of sourceMap.entries()) {
    if (usedSource.has(id)) continue;
    deletedSet.push({
      first: sourceElem,
      second: null,
      differenceCost: 1,
    });
  }

  // 4) remaining target elements → added
  for (const [id, targetElem] of targetMap.entries()) {
    if (usedTarget.has(id)) continue;
    addedSet.push({
      first: null,
      second: targetElem,
      differenceCost: 1,
    });
  }

  const penalty =
    matchingSet.reduce((s, p) => s + p.differenceCost, 0) +
    addedSet.reduce((s, p) => s + p.differenceCost, 0) +
    deletedSet.reduce((s, p) => s + p.differenceCost, 0);

  return {
    penalty,
    matchingSet,
    addedSet,
    deletedSet,
  };
}
