import React, { useRef, useEffect, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "../../styles/bpmn.css";
import { Box, Alert } from "@mui/material";
import { getDefaultBPMNXML } from "../../utils/bpmnUtils";
import type { BPMNElementStatus, User } from "../../types";
import { useBPMNStore } from "../../stores/bpmnStore";
import { useIssueStore } from "../../stores/issueStore";
import { useUserStore } from "../../stores/userStore";
import { useChangelogStore } from "../../stores/changelogStore";
import { compareBpmnXml } from "./BpmnGreedyComparator";

interface BPMNModelerProps {
  xml?: string;
  onSave?: (xml: string) => void;
  onElementClick?: (
    elementId: string,
    elementType: string,
    elementName: string
  ) => void;
  onChangesDetected?: () => void;
  elementStatuses?: BPMNElementStatus[];
  lastCommittedXml?: string; // <-- ADDED PROP, for last committedXML
  className?: string;
  diagramId?: string;
}

const BPMNModeler: React.FC<BPMNModelerProps> = ({
  xml,
  onSave,
  onElementClick,
  onChangesDetected,
  lastCommittedXml,
  elementStatuses = [],
  className = "",
  diagramId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { issues } = useIssueStore();
  const { getUserById } = useUserStore();
  const { addChangeLogs } = useChangelogStore();
  const previousElementsRef = useRef<
    Map<string, { name: string; type: string }>
  >(new Map());
  const lastChangeTimeRef = useRef<number>(0);
  const pendingChangesRef = useRef<
    Array<{
      elementId: string;
      elementName: string;
      elementType: string;
      changeType: "update" | "added" | "deleted" | "link" | "unlink";
      relatedIssueId?: string;
    }>
  >([]);
  const previousXmlRef = useRef<string>("");
  const currentXmlRef = useRef<string>("");

  const logXmlChanges = (previousXml: string, currentXml: string) => {
    //Only log changes if a committed baseline exists.
    //change history is zero until sprint is completed
    if (!lastCommittedXml) {
      return;
    }

    try {
      const result = compareBpmnXml(previousXml, currentXml);

      const changes: Array<{
        elementId: string;
        elementName: string;
        elementType: string;
        changeType: "update" | "added" | "deleted" | "link" | "unlink";
        relatedIssueId?: string;
      }> = [];

      // 处理删除的元素
      const deletedElements = new Map<string, any>();
      result.deletedSet.forEach((pair) => {
        const element = pair.first;
        if (element) {
          deletedElements.set(element.id, element);
        }
      });

      // 处理添加的元素
      const addedElements = new Map<string, any>();
      result.addedSet.forEach((pair) => {
        const element = pair.second;
        if (element) {
          addedElements.set(element.id, element);
        }
      });

      // 检查修改（删除后又添加相同ID的元素）
      const modifiedElements = new Set<string>();
      for (const [id, deletedElement] of deletedElements) {
        if (addedElements.has(id)) {
          modifiedElements.add(id);
          const addedElement = addedElements.get(id);

          // 对于Task类型的修改，记录为update
          if (
            deletedElement.type.includes("Task") ||
            deletedElement.type === "ExclusiveGateway"
          ) {
            changes.push({
              elementId: id,
              elementName: addedElement.name || "",
              elementType: addedElement.type,
              changeType: "update",
            });
          }
        }
      }

      // 处理真正删除的元素（不在修改列表中的）
      for (const [id, element] of deletedElements) {
        if (!modifiedElements.has(id)) {
          if (
            element.type.includes("Task") ||
            element.type === "ExclusiveGateway" ||
            element.type === "SequenceFlow"
          ) {
            changes.push({
              elementId: id,
              elementName: element.name || "",
              elementType: element.type,
              changeType: "deleted",
            });
          }
        }
      }

      // 处理真正添加的元素（不在修改列表中的）
      for (const [id, element] of addedElements) {
        if (!modifiedElements.has(id)) {
          if (
            element.type.includes("Task") ||
            element.type === "ExclusiveGateway" ||
            element.type === "SequenceFlow"
          ) {
            changes.push({
              elementId: id,
              elementName: element.name || "",
              elementType: element.type,
              changeType: "added",
            });
          }
        }
      }

      result.matchingSet.forEach((pair) => {
        const sourceElement = pair.first;
        const targetElement = pair.second;
        if (
          sourceElement &&
          targetElement &&
          sourceElement.type === "SequenceFlow" &&
          pair.differenceCost > 0
        ) {
          changes.push({
            elementId: sourceElement.id,
            elementName: targetElement.name || "",
            elementType: targetElement.type,
            changeType: "update",
          });
        }
      });

      if (changes.length > 0) {
        console.log("记录的变更:", changes);
        saveChangesToDatabase(changes);
      }

      if (result.deletedSet.length > 0) {
        console.log("---  删除的元素 ---");
        result.deletedSet.forEach((pair) => {
          const element = pair.first;
          if (element) {
            console.log(
              `${element.type}: ${element.id} ${
                element.name ? `"${element.name}"` : ""
              }`
            );
          }
        });
      }

      // 添加的元素
      if (result.addedSet.length > 0) {
        console.log("---添加的元素 ---");
        result.addedSet.forEach((pair) => {
          const element = pair.second;
          if (element) {
            console.log(
              `${element.type}: ${element.id} ${
                element.name ? `"${element.name}"` : ""
              }`
            );
          }
        });
      }

      // 修改的元素（名称变化）
      const modifiedElementsForDisplay = result.matchingSet.filter(
        (pair) => pair.differenceCost > 0
      );
      if (modifiedElementsForDisplay.length > 0) {
        console.log("--- 修改的元素 ---");
        modifiedElementsForDisplay.forEach((pair) => {
          const sourceElement = pair.first;
          const targetElement = pair.second;
          if (sourceElement && targetElement) {
            const sourceName = sourceElement.name || "";
            const targetName = targetElement.name || "";
            console.log(
              `${sourceElement.type}: ${sourceElement.id} (名称变化: "${sourceName}" → "${targetName}")`
            );
          }
        });
      }

      if (
        result.deletedSet.length === 0 &&
        result.addedSet.length === 0 &&
        modifiedElementsForDisplay.length === 0
      ) {
        console.log("文件相同！没有发现结构性差异。");
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (containerRef.current) {
      if (
        containerRef.current.offsetWidth === 0 ||
        containerRef.current.offsetHeight === 0
      ) {
        containerRef.current.style.width = "100%";
        containerRef.current.style.height = "500px";
      }

      modelerRef.current = new BpmnModeler({
        container: containerRef.current,
      });

      const bpmnXml = xml || getDefaultBPMNXML();

      setTimeout(() => {
        if (modelerRef.current) {
          modelerRef.current
            .importXML(bpmnXml)
            .then((result: any) => {
              if (result.warnings && result.warnings.length > 0) {
                console.warn("BPMN import warnings:", result.warnings);
              }
              setError(null);

              previousXmlRef.current = bpmnXml;
              currentXmlRef.current = bpmnXml;
              // console.log('=== BPMN 初始XML记录 ===');
              // console.log('初始XML:', bpmnXml);
              // console.log('=== 初始XML记录结束 ===');

              setupEventListeners();

              setTimeout(() => {
                applyElementStyles();
                previousElementsRef.current = new Map(getCurrentElements());
              }, 100);
            })
            .catch((err: any) => {
              console.error("Error importing BPMN XML:", err);
              setError(
                `Failed to load BPMN diagram: ${err.message || "Unknown error"}`
              );
            });
        }
      }, 100);
    }

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [xml]);

  useEffect(() => {
    applyElementStyles();
  }, [issues]);

  const saveChangesToDatabase = async (
    changes: Array<{
      elementId: string;
      elementName: string;
      elementType: string;
      changeType: "update" | "added" | "deleted" | "link" | "unlink";
      relatedIssueId?: string;
    }>
  ) => {
    if (!diagramId || changes.length === 0) return;

    const now = Date.now();
    pendingChangesRef.current = [...pendingChangesRef.current, ...changes];
    lastChangeTimeRef.current = now;

    setTimeout(async () => {
      if (
        now === lastChangeTimeRef.current &&
        pendingChangesRef.current.length > 0
      ) {
        const changesToSave = [...pendingChangesRef.current];
        pendingChangesRef.current = [];

        // Add diagramId to each change and use the store
        const changeLogsWithDiagram = changesToSave.map((change) => ({
          ...change,
          diagramId,
        }));

        try {
          await addChangeLogs(changeLogsWithDiagram);

          if (onChangesDetected) {
            onChangesDetected();
          }
        } catch (error) {
          console.error("Failed to save changes:", error);
        }
      }
    }, 500);
  };

  const getCurrentElements = (): Map<
    string,
    { name: string; type: string }
  > => {
    if (!modelerRef.current) return new Map();

    try {
      const elementRegistry = modelerRef.current.get("elementRegistry") as any;
      if (!elementRegistry) return new Map();

      const allElements = elementRegistry.getAll();
      const elementMap = new Map<string, { name: string; type: string }>();

      allElements.forEach((element: any) => {
        if (element.businessObject && element.businessObject.id) {
          const elementId = element.businessObject.id;
          const elementName = element.businessObject.name || "";
          const elementType =
            element.type || element.businessObject.$type || "";
          elementMap.set(elementId, { name: elementName, type: elementType });
        }
      });

      return elementMap;
    } catch (err) {
      console.warn("Failed to get current elements:", err);
      return new Map();
    }
  };

  const shouldIgnoreElement = (elementType: string, elementName: string) => {
    return (
      elementType.includes("Flow") ||
      elementType.includes("SequenceFlow") ||
      !elementName.trim()
    );
  };

  const detectElementChanges = async () => {
    // const currentElements = getCurrentElements();
    // const previousElements = previousElementsRef.current;
    // const changes: Array<{elementId: string, elementName: string, elementType: string, changeType: 'added' | 'deleted' | 'link' | 'unlink', relatedIssueId?: string}> = [];
    // for (const [currentId, currentInfo] of currentElements) {
    //   if (!previousElements.has(currentId)) {
    //     if (!shouldIgnoreElement(currentInfo.type, currentInfo.name)) {
    //       changes.push({
    //         elementId: currentId,
    //         elementName: currentInfo.name,
    //         elementType: currentInfo.type,
    //         changeType: 'added'
    //       });
    //       console.log('Added elements:', currentId);
    //     }
    //   } else {
    //     const previousInfo = previousElements.get(currentId)!;
    //     if (previousInfo.name !== currentInfo.name) {
    //       if (previousInfo.name === '' && currentInfo.name !== '') {
    //         if (!shouldIgnoreElement(currentInfo.type, currentInfo.name)) {
    //           changes.push({
    //             elementId: currentId,
    //             elementName: currentInfo.name,
    //             elementType: currentInfo.type,
    //             changeType: 'added'
    //           });
    //           console.log('Element got its first name (real added):', currentId, 'Name:', currentInfo.name);
    //         }
    //       } else {
    //         console.log('Name changed elements:', `${currentId}: "${previousInfo.name}" → "${currentInfo.name}"`);
    //       }
    //     }
    //   }
    // }
    // for (const [previousId, previousInfo] of previousElements) {
    //   if (!currentElements.has(previousId)) {
    //     if (!shouldIgnoreElement(previousInfo.type, previousInfo.name)) {
    //       changes.push({
    //         elementId: previousId,
    //         elementName: previousInfo.name,
    //         elementType: previousInfo.type,
    //         changeType: 'deleted'
    //       });
    //       console.log('Deleted elements:', `${previousId} (名称: "${previousInfo.name}")`);
    //     }
    //   }
    // }
    // if (changes.length > 0) {
    //   await saveChangesToDatabase(changes);
    // }
    // previousElementsRef.current = new Map(currentElements);
  };

  const setupEventListeners = () => {
    if (!modelerRef.current) return;

    const eventBus = modelerRef.current.get("eventBus") as any;

    eventBus.on("element.click", 1500, (event: any) => {
      const { element } = event;
      const clickableTypes = [
        "bpmn:Task",
        "bpmn:UserTask",
        "bpmn:ServiceTask",
        "bpmn:ManualTask",
        "bpmn:BusinessRuleTask",
        "bpmn:ScriptTask",
        "bpmn:SendTask",
        "bpmn:ReceiveTask",
      ];

      if (element.businessObject && element.businessObject.id) {
        const elementType = element.type;
        const isClickableElement = clickableTypes.some((type) =>
          elementType.includes(type)
        );

        if (isClickableElement) {
          const elementId = element.businessObject.id;
          const elementName = element.businessObject.name || elementId;

          if (onElementClick) {
            onElementClick(elementId, elementType, elementName);
          }
        }
      }
    });

    eventBus.on("element.contextmenu", 1500, (event: any) => {
      const { element } = event;
      const clickableTypes = [
        "bpmn:Task",
        "bpmn:UserTask",
        "bpmn:ServiceTask",
        "bpmn:ManualTask",
        "bpmn:BusinessRuleTask",
        "bpmn:ScriptTask",
        "bpmn:SendTask",
        "bpmn:ReceiveTask",
      ];

      if (element.businessObject && element.businessObject.id) {
        const elementType = element.type;
        const isClickableElement = clickableTypes.some((type) =>
          elementType.includes(type)
        );

        if (isClickableElement) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    eventBus.on("commandStack.changed", () => {
      detectElementChanges();

      setTimeout(() => {
        applyElementStyles();
      }, 100);

      if (modelerRef.current) {
        modelerRef.current.saveXML({ format: true }).then((result: any) => {
          const newXml = result.xml;
          const previousXml = currentXmlRef.current;

          if (previousXml !== newXml) {
            logXmlChanges(previousXml, newXml);
            previousXmlRef.current = previousXml;
            currentXmlRef.current = newXml;
          }

          if (onSave) {
            onSave(newXml);
          }
        });
      }
    });
  };

  const getLinkedIssues = (elementId: string) => {
    return issues.filter((issue) =>
      issue.linkedBPMNElements?.some(
        (element) =>
          element.elementId === elementId &&
          (!diagramId || element.diagramId === diagramId)
      )
    );
  };

  const calculateElementProgress = (
    elementId: string
  ): {
    progress: number;
    color: string;
    showProgress: boolean;
    assignee: User | null;
  } => {
    const linkedIssues = getLinkedIssues(elementId);
    const progressValues: number[] = [];
    let hasCompletedIssue = false;
    let hasInProgressIssue = false;
    let primaryAssignee: User | null = null;

    linkedIssues.forEach((issue) => {
      if (issue.status === "DONE") {
        progressValues.push(100);
        hasCompletedIssue = true;
      } else if (
        issue.status === "IN_PROGRESS" &&
        issue.progress !== undefined
      ) {
        progressValues.push(issue.progress);
        hasInProgressIssue = true;
      }

      if (!primaryAssignee && issue.assigneeId) {
        primaryAssignee = getUserById(issue.assigneeId) || null;
      }
    });

    if (progressValues.length === 0) {
      return {
        progress: 0,
        color: "#e0e0e0",
        showProgress: false,
        assignee: null,
      };
    }

    const averageProgress = Math.round(
      progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length
    );

    let color = "#1976d2";
    if (hasCompletedIssue && averageProgress === 100) {
      color = "#4caf50";
    } else if (hasInProgressIssue || averageProgress > 0) {
      color = "#1976d2";
    }

    return {
      progress: averageProgress,
      color,
      showProgress: hasInProgressIssue || hasCompletedIssue,
      assignee: primaryAssignee,
    } as const;
  };

  const createAvatarAndProgressBar = (element: any, overlays: any) => {
    const elementId = element.businessObject.id;

    try {
      overlays.remove({ element: elementId });
    } catch (e) {
      // Ignore if no overlays exist
    }

    const { progress, color, showProgress, assignee } =
      calculateElementProgress(elementId);

    if (!showProgress) {
      return;
    }

    const avatarSrc =
      assignee?.avatar || "https://mui.com/static/images/avatar/1.jpg";

    const overlayHtml = `
      <div style="display: flex; align-items: center; gap: 5px; padding: 2px; background: rgba(255,255,255,0.9); border-radius: 4px; border: 1px solid #ddd;">
        <img src="${avatarSrc}" 
             style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${color};" />
        <div style="display: flex; align-items: center; min-width: 60px;">
          <div style="width: 40px; height: 12px; background: #e0e0e0; border-radius: 6px; border: 1px solid #bdbdbd; position: relative; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: ${color}; border-radius: 5px;"></div>
          </div>
          <span style="margin-left: 4px; font-size: 10px; font-weight: bold; color: #000;">${progress}%</span>
        </div>
      </div>
    `;

    const overlayElement = document.createElement("div");
    overlayElement.innerHTML = overlayHtml;
    overlayElement.style.pointerEvents = "none";

    overlays.add(element, {
      position: {
        bottom: -5,
        left: 0,
      },
      html: overlayElement.firstElementChild,
    });
  };
  // ,,,,,,,,,
  const applyElementStyles = () => {
    if (!modelerRef.current) return;

    try {
      // === 1. Get BPMN services ===
      const canvas = modelerRef.current.get("canvas") as any;
      const elementRegistry = modelerRef.current.get("elementRegistry") as any;
      const overlays = modelerRef.current.get("overlays") as any;

      if (!canvas || !elementRegistry || !overlays) {
        console.warn("BPMN services not available yet");
        return;
      }

      const allElements = elementRegistry.getAll();

      allElements.forEach((element: any) => {
        if (element.businessObject && element.businessObject.id) {
          const elementType = element.type;
          const clickableTypes = [
            "bpmn:Task",
            "bpmn:UserTask",
            "bpmn:ServiceTask",
            "bpmn:ManualTask",
            "bpmn:BusinessRuleTask",
            "bpmn:ScriptTask",
            "bpmn:SendTask",
            "bpmn:ReceiveTask",
          ];

          const isClickableElement = clickableTypes.some((type) =>
            elementType.includes(type)
          );

          if (isClickableElement) {
            createAvatarAndProgressBar(element, overlays);
          }
        }
      });
    } catch (err) {
      console.warn("Failed to apply element styles:", err);
    }
  };

  if (error) {
    return (
      <Box
        className={`w-full h-full flex items-center justify-center ${className}`}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      className={`w-full h-full ${className}`}
      style={{ minHeight: "500px" }}
    >
      <div
        ref={containerRef}
        className="bpmn-container w-full h-full"
        style={{
          minHeight: "500px",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />
    </Box>
  );
};

export default BPMNModeler;
