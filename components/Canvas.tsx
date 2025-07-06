"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

interface CustomCanvasRenderingContext2D extends CanvasRenderingContext2D {
  lastX?: number;
  lastY?: number;
}

let socket: Socket | null = null;

interface User {
  username: string;
  userID: string;
}

interface CanvasProps {
  color: string;
  lineWidth: number;
  username: string;
  clearCanvas: boolean;
  setClearCanvas: (value: boolean) => void;
  setUserList: (users: any[]) => void;
  saveRef: React.MutableRefObject<() => void>;
  loadRef: React.MutableRefObject<() => void>;
  setSavedDrawings: (drawings: any[]) => void;
  savedDrawings: any[];
}

const Canvas = ({
  color,
  lineWidth,
  username,
  clearCanvas,
  setClearCanvas,
  setUserList,
  saveRef,
  loadRef,
  setSavedDrawings,
  savedDrawings,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CustomCanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingData, setDrawingData] = useState<any[]>([]);

  useEffect(() => {
    socket = io("http://localhost:3001");
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      // Initialize user list on connection
      socket?.emit("userList", []);
    });
    socket.on("draw", (data: any) => {
      drawOnCanvasFromSocket(data);
    });
    socket.on("clear", clear);
    socket.on("userList", (userList) => {
      // Ensure we're not setting state during SSR
      if (typeof window !== 'undefined') {
        setUserList(userList);
      }
    });
    return () => { socket?.disconnect(); };
  }, []);

  useEffect(() => {
    if (username && socket) {
      socket.emit("setUsername", username);
    }
  }, [username]);

  useEffect(() => {
    if (clearCanvas) {
      socket?.emit("clear");
      clear();
    }
    setClearCanvas(false);
  }, [clearCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d") as CustomCanvasRenderingContext2D;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
    }
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    const offsetX = e.clientX - (rect?.left || 0);
    const offsetY = e.clientY - (rect?.top || 0);
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
      ctxRef.current.lastX = offsetX;
      ctxRef.current.lastY = offsetY;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (ctxRef.current) {
      ctxRef.current.lastX = undefined;
      ctxRef.current.lastY = undefined;
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !ctxRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const offsetX = e.clientX - (rect?.left || 0);
    const offsetY = e.clientY - (rect?.top || 0);
    const prevX = ctxRef.current.lastX ?? offsetX;
    const prevY = ctxRef.current.lastY ?? offsetY;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(prevX, prevY);
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    socket?.emit("draw", { x: offsetX, y: offsetY, prevX, prevY, color, lineWidth });
    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const drawOnCanvasFromSocket = (data: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(data.prevX, data.prevY);
      ctx.lineTo(data.x, data.y);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.lineWidth;
      ctx.stroke();
    }
  };

  const startDrawingOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingData([...drawingData, { type: "start", x, y, color, lineWidth }]);
    }
  };

  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const rect = canvas?.getBoundingClientRect();
    if (ctx && rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const prevPoint = drawingData[drawingData.length - 1];
      const prevX = prevPoint?.x || x;
      const prevY = prevPoint?.y || y;

      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      setDrawingData([...drawingData, { x, y, color, lineWidth }]);
      socket?.emit("draw", { x, y, prevX, prevY, color, lineWidth });
    }
  };

  const stopDrawingOnCanvas = () => {
    setIsDrawing(false);
  };

  const saveDrawing = async () => {
    if (!username) {
      alert("Please login to save drawings");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/save-drawing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          drawingData,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // After successful save, reload the drawings list
        loadDrawing();
        alert("Drawing saved successfully!");
      } else {
        alert("Failed to save drawing");
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      alert("Failed to save drawing");
    }
  };

  const loadDrawing = async (drawingIndex?: number) => {
    if (!username) {
      alert("Please login to load drawings");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/load-drawings/${username}`
      );
      const data = await response.json();
      if (data.success && data.drawings.length > 0) {
        setSavedDrawings(data.drawings);
        
        if (drawingIndex !== undefined) {
          const drawing = data.drawings[drawingIndex];
          setDrawingData(drawing.drawingData);
          // Clear canvas and redraw
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let isNewPath = true;
            drawing.drawingData.forEach((point: any) => {
              if (point.type === "start") {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                isNewPath = false;
              } else {
                if (isNewPath) {
                  ctx.beginPath();
                  ctx.moveTo(point.x, point.y);
                  isNewPath = false;
                } else {
                  ctx.lineTo(point.x, point.y);
                  ctx.strokeStyle = point.color;
                  ctx.lineWidth = point.lineWidth;
                  ctx.stroke();
                }
              }
            });
          }
        }
      } else {
        setSavedDrawings([]);
      }
    } catch (error) {
      console.error("Error loading drawing:", error);
      alert("Failed to load drawing");
    }
  };

  useEffect(() => {
    saveRef.current = saveDrawing;
    loadRef.current = loadDrawing;
  }, [drawingData, username]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawingOnCanvas}
      onMouseUp={stopDrawingOnCanvas}
      onMouseMove={drawOnCanvas}
      onMouseOut={stopDrawingOnCanvas}
      style={{
        border: "1px solid black",
        cursor: "crosshair",
        background: "white",
        width: "100%",
        height: "80vh",
      }}
    />
  );
};

export default Canvas;
