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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, Pen } from "lucide-react";

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
  onSave: () => void;
  onLoad: () => void;
  onLogin: (username: string, password: string) => void;
  onLogout: () => void;
  onRegister: () => void;
  onNewDrawing: () => void;
  isLoggedIn: boolean;
  userList: User[];
  username: string;
  savedDrawings: any[];
  onLoadDrawing: (index: number) => void;
}

const ToolBar = ({
  onColorChange,
  onLineWidthChange,
  onClearCanvas,
  onNameChange,
  onErase,
  onSave,
  onLoad,
  onLogin,
  onLogout,
  onRegister,
  onNewDrawing,
  isLoggedIn,
  userList,
  username,
  savedDrawings,
  onLoadDrawing,
}: ToolBarProps) => {
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState([3]);
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    onColorChange(selectedColor);
  };

  const handleLineWidthChange = (value: number[]) => {
    setLineWidth(value);
    onLineWidthChange(value[0]);
  };

  const handleLogin = async () => {
    if (!inputUsername || !inputPassword) {
      setError("Username and password are required");
      return;
    }

    try {
      console.log("Attempting login...");
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: inputUsername,
          password: inputPassword,
        }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        onLogin(inputUsername, inputPassword);
        setError("");
        setInputUsername("");
        setInputPassword("");
      } else {
        setError(data.message || "Failed to login");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to server");
    }
  };

  const handleRegister = async () => {
    if (!inputUsername || !inputPassword) {
      setError("Username and password are required");
      return;
    }

    try {
      console.log("Attempting registration...");
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: inputUsername,
          password: inputPassword,
        }),
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (data.success) {
        onLogin(inputUsername, inputPassword);
        setError("");
        setInputUsername("");
        setInputPassword("");
      } else {
        setError(data.message || "Failed to register");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Failed to connect to server");
    }
  };

  return (
    <Card className="w-full bg-orange-400 overflow-hidden relative px-4 py-3 shadow-xl rounded-none font-sans">
      <CardContent className="relative z-10 flex justify-between items-center flex-wrap gap-4">
        {/* Users Online */}
        {isLoggedIn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-40 justify-start">
                Users Online ({userList?.length || 0})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!userList || userList.length === 0 ? (
                <DropdownMenuItem disabled>No users</DropdownMenuItem>
              ) : (
                userList.map((user) => (
                  <DropdownMenuItem key={`${user.userID}-${user.username}`}>
                    {user.username} ({user.userID})
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Brush and Color */}
        <div className="flex items-center gap-2">
          <label className="text-md font-semibold text-black-700 flex items-center gap-1">
            <Pen className="w-4 h-4" /> Brush
          </label>
          {["#000000", "#ff0000", "#0000ff"].map((c) => (
            <button
              key={c}
              onClick={() => handleColorSelect(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-black" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="w-6 h-6 rounded-full overflow-hidden border"
          />
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Brush Size</label>
          <Slider
            max={50}
            step={1}
            value={lineWidth}
            onValueChange={handleLineWidthChange}
            className="w-24"
          />
          <span className="text-xs text-gray-500 w-8 text-center">{lineWidth[0]} px</span>
        </div>

        {/* Erase and Clear */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onErase} className="text-red-600 border-red-300 hover:bg-red-100">Erase</Button>
          <Button variant="destructive" onClick={() => onClearCanvas(true)}>Clear</Button>
        </div>

        {/* Login/Register Form */}
        {!isLoggedIn && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="w-32"
              />
              <Input
                type="password"
                placeholder="Password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-32"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleLogin} className="text-sm bg-blue-600 text-white">
                Login
              </Button>
              <Button onClick={handleRegister} variant="outline" className="text-sm">
                Register
              </Button>
            </div>
          </div>
        )}

        {/* User Info and Actions */}
        {isLoggedIn && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-semibold">
              Welcome, {username}!
            </span>
            <Button variant="default" onClick={onSave}>
              Save
            </Button>
            <Button variant="ghost" onClick={onLogout} className="text-red-600">
              Logout
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Menu className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onNewDrawing}>
                  New Drawing
                </DropdownMenuItem>
                {savedDrawings && savedDrawings.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {savedDrawings.map((drawing, index) => (
                      <DropdownMenuItem 
                        key={index} 
                        onClick={() => onLoadDrawing(index)}
                      >
                        Drawing {index + 1}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ToolBar;