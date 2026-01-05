import React, { useRef, useEffect, useState } from "react";
import BpmnViewer from "bpmn-js/lib/Viewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "../../styles/bpmn.css";
import { Box, Alert } from "@mui/material";
import { useIssueStore } from "../../stores/issueStore";
import { useUserStore } from "../../stores/userStore";
import type { BPMNElementStatus, User } from "../../types";

interface BPMNViewerProps {
  xml: string;
  onElementClick?: (
    elementId: string,
    elementType: string,
    elementName: string
  ) => void;
  elementStatuses?: BPMNElementStatus[];
  className?: string;
  diagramId?: string;
}

const BPMNViewer: React.FC<BPMNViewerProps> = ({
  xml,
  onElementClick,
  elementStatuses = [],
  className = "",
  diagramId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { issues } = useIssueStore();
  const { getUserById } = useUserStore();

  console.log("elementStatuses prop (deprecated):", elementStatuses);

  useEffect(() => {
    if (containerRef.current && xml) {
      if (
        containerRef.current.offsetWidth === 0 ||
        containerRef.current.offsetHeight === 0
      ) {
        containerRef.current.style.width = "100%";
        containerRef.current.style.height = "500px";
      }

      viewerRef.current = new BpmnViewer({
        container: containerRef.current,
      });

      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current
            .importXML(xml)
            .then((result: any) => {
              if (result.warnings && result.warnings.length > 0) {
                console.warn("BPMN import warnings:", result.warnings);
              }
              setError(null);
              setupEventListeners();

              setTimeout(() => {
                applyElementStyles();
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
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [xml]);

  useEffect(() => {
    applyElementStyles();
  }, [issues]);

  const setupEventListeners = () => {
    if (!viewerRef.current) return;

    const eventBus = viewerRef.current.get("eventBus") as any;

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
          event.preventDefault();
          event.stopPropagation();

          const elementId = element.businessObject.id;
          const elementName = element.businessObject.name || elementId;

          if (onElementClick) {
            onElementClick(elementId, elementType, elementName);
          }
        }
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

  const applyElementStyles = () => {
    if (!viewerRef.current) return;

    try {
      const elementRegistry = viewerRef.current.get("elementRegistry") as any;
      const overlays = viewerRef.current.get("overlays") as any;

      if (!elementRegistry || !overlays) {
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

export default BPMNViewer;
