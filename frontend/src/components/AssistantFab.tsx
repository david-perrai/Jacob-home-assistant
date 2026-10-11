import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { Fab } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface AssistantFabProps {
  isRecording: boolean;
  isBusy: boolean;
  onToggleRecording: () => void;
}

type FloatingButtonPosition = {
  left: number;
  top: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
  initialLeft: number;
  initialTop: number;
  timer: ReturnType<typeof setTimeout>;
  dragging: boolean;
  moved: boolean;
};

export default function AssistantFab({
  isRecording,
  isBusy,
  onToggleRecording,
}: AssistantFabProps) {
  const [floatingButtonPosition, setFloatingButtonPosition] =
    useState<FloatingButtonPosition | null>(null);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(
    () => () => {
      if (dragStateRef.current) clearTimeout(dragStateRef.current.timer);
    },
    [],
  );

  return (
    <Fab
      color={isRecording ? "error" : "primary"}
      aria-label={isRecording ? "Arrêter l'enregistrement" : "Parler à Jacob"}
      title="Maintenez pour déplacer"
      disabled={isBusy}
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onToggleRecording();
      }}
      onPointerDown={(event) => {
        if (isBusy || event.button !== 0) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const dragState: Omit<DragState, "timer"> = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          latestX: event.clientX,
          latestY: event.clientY,
          initialLeft: bounds.left,
          initialTop: bounds.top,
          dragging: false,
          moved: false,
        };
        const timer = setTimeout(() => {
          const currentDrag = dragStateRef.current;
          if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

          currentDrag.dragging = true;
          setIsDraggingButton(true);
          setFloatingButtonPosition({
            left: currentDrag.initialLeft,
            top: currentDrag.initialTop,
          });
          if (
            currentDrag.latestX !== currentDrag.startX ||
            currentDrag.latestY !== currentDrag.startY
          ) {
            currentDrag.moved = true;
            const maxLeft = window.innerWidth - bounds.width;
            const maxTop = window.innerHeight - bounds.height;
            setFloatingButtonPosition({
              left: Math.max(
                0,
                Math.min(
                  maxLeft,
                  currentDrag.initialLeft + currentDrag.latestX - currentDrag.startX,
                ),
              ),
              top: Math.max(
                0,
                Math.min(
                  maxTop,
                  currentDrag.initialTop + currentDrag.latestY - currentDrag.startY,
                ),
              ),
            });
          }
        }, 350);
        dragStateRef.current = { ...dragState, timer };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        dragState.latestX = event.clientX;
        dragState.latestY = event.clientY;
        if (!dragState.dragging) return;

        dragState.moved =
          dragState.moved ||
          Math.abs(event.clientX - dragState.startX) > 3 ||
          Math.abs(event.clientY - dragState.startY) > 3;
        const bounds = event.currentTarget.getBoundingClientRect();
        setFloatingButtonPosition({
          left: Math.max(
            0,
            Math.min(
              window.innerWidth - bounds.width,
              dragState.initialLeft + event.clientX - dragState.startX,
            ),
          ),
          top: Math.max(
            0,
            Math.min(
              window.innerHeight - bounds.height,
              dragState.initialTop + event.clientY - dragState.startY,
            ),
          ),
        });
      }}
      onPointerUp={(event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        clearTimeout(dragState.timer);
        suppressClickRef.current = dragState.moved;
        dragStateRef.current = null;
        setIsDraggingButton(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        clearTimeout(dragState.timer);
        dragStateRef.current = null;
        setIsDraggingButton(false);
        suppressClickRef.current = false;
      }}
      sx={{
        position: "fixed",
        zIndex: 1300,
        ...(floatingButtonPosition
          ? {
              left: floatingButtonPosition.left,
              top: floatingButtonPosition.top,
              right: "auto",
              bottom: "auto",
            }
          : { right: 24, bottom: 24 }),
        touchAction: "none",
        userSelect: "none",
        cursor: isDraggingButton ? "grabbing" : "grab",
      }}
    >
      {isRecording ? <StopIcon /> : <MicIcon />}
    </Fab>
  );
}
