"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  username: string;
  userID: string;
}

interface ToolBarProps {
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onClearCanvas: (value: boolean) => void;
  onNameChange: (name: string) => void;
  onErase: () => void;
  userList: User[];
}

const ToolBar = ({
  onColorChange,
  onLineWidthChange,
  onClearCanvas,
  onNameChange,
  onErase,
  userList,
}: ToolBarProps) => {
  const [color, setColor] = useState("#000000");
  const [username, setUsername] = useState("");
  const [lineWidth, setLineWidth] = useState([3]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onColorChange(newColor);
  };

  const handleLineWidthChange = (value: number[]) => {
    setLineWidth(value);
    onLineWidthChange(value[0]);
  };

  return (
    <Card className="w-full bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 p-4 shadow-xl rounded-2xl font-sans">
      <CardContent className="flex flex-col gap-4">
        {/* Top Row: Users Online & Username */}
        <div className="flex justify-between items-center">
          {/* 👥 Connected Users */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Users Online</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-40 justify-start">
                  All Users ({userList.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {userList.length === 0 ? (
                  <DropdownMenuItem disabled>No users</DropdownMenuItem>
                ) : (
                  userList.map((user) => (
                    <DropdownMenuItem key={user.userID}>
                      {user.username} ({user.userID})
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 🧑 Username Input */}
          <div className="flex flex-col gap-1 items-end">
            <label className="text-sm font-semibold text-gray-700">Your Name</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={username}
                placeholder="Enter your name"
                className="w-40 p-2 text-sm border border-gray-300 rounded-md"
                onChange={handleUsernameChange}
              />
              <Button onClick={() => onNameChange(username)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
                Set
              </Button>
            </div>
          </div>
        </div>

        {/* Middle Row: Tools */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* 🎨 Color Picker */}
          <div className="flex flex-col items-start gap-1">
            <label className="text-sm font-semibold text-gray-700">Color</label>
            <Input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="w-12 h-12 p-1 border border-gray-300 rounded-full"
            />
          </div>

          {/* 📏 Line Width */}
          <div className="flex flex-col items-start gap-2">
            <label className="text-sm font-semibold text-gray-700">Brush Size</label>
            <Slider
              max={50}
              step={1}
              value={lineWidth}
              onValueChange={handleLineWidthChange}
              className="w-40"
            />
            <span className="text-xs text-gray-500">{lineWidth[0]} px</span>
          </div>

          {/* 🧰 Tools */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-700">Canvas</span>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onErase}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                Erase
              </Button>
              <Button
                variant="destructive"
                onClick={() => onClearCanvas(true)}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolBar;
