"use client";

import { useState } from "react";
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

  return (
    <div>
      <ToolBar
        onColorChange={setColor}
        onLineWidthChange={setLineWidth}
        onClearCanvas={setClearCanvas}
        onNameChange={setUsername}
        onErase={() => setColor("#FFFFFF")}
        userList={userList}
      />
      <Canvas
        color={color}
        lineWidth={lineWidth}
        username={username}
        clearCanvas={clearCanvas}
        setClearCanvas={setClearCanvas}
        setUserList={setUserList}
      />
    </div>
  );
}
