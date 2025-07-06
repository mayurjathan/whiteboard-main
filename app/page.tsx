"use client";

import { useRef, useState } from "react";
import Canvas from "@/components/Canvas";
import ToolBar from "@/components/ToolBar";


interface User {
  username: string;
  userID: string;
}

export default function Home() {
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [clearCanvas, setClearCanvas] = useState(false);
  const [username, setUsername] = useState("");
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<any[]>([]);
  const saveRef = useRef<() => void>(() => {});
  const loadRef = useRef<(index?: number) => void>(() => {});

  const handleLogin = (uname: string, pwd: string) => {
    setUsername(uname);
    setIsLoggedIn(true);
    // Load saved drawings when user logs in
    loadRef.current();
  };

  const handleLogout = () => {
    setUsername("");
    setIsLoggedIn(false);
    setClearCanvas(true);
  };

  const handleNewDrawing = () => {
    setClearCanvas(true);
    setTimeout(() => setClearCanvas(false), 100); // Reset the flag after a short delay
  };

  return (
    <div>
      <ToolBar
        onColorChange={setColor}
        onLineWidthChange={setLineWidth}
        onClearCanvas={setClearCanvas}
        onNameChange={setUsername}
        onErase={() => setColor("#FFFFFF")}
        onSave={() => saveRef.current()}
        onLoad={() => loadRef.current()}
        onLogin={handleLogin}
        onRegister={() => {}} // Handled in ToolBar component
        onLogout={handleLogout}
        onNewDrawing={handleNewDrawing}
        isLoggedIn={isLoggedIn}
        userList={userList}
        username={username}
        savedDrawings={savedDrawings}
        onLoadDrawing={(index: number) => loadRef.current(index)}
      />
      <Canvas
        color={color}
        lineWidth={lineWidth}
        username={username}
        clearCanvas={clearCanvas}
        setClearCanvas={setClearCanvas}
        setUserList={setUserList}
        saveRef={saveRef}
        loadRef={loadRef}
        setSavedDrawings={setSavedDrawings}
        savedDrawings={savedDrawings}
      />
    </div>
  );
}
