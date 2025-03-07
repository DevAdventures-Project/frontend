import { useEffect, useRef } from "react";
import { WebSocketContext, socket } from "./contexts/WebSocketContext";
import { type IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import type { CozyCity } from "./game/scenes/CozyCity";
import type { Dungeon } from "./game/scenes/Dungeon";
import { Kanojedo } from "./game/scenes/Kanojedo";
import type { MainMenu } from "./game/scenes/MainMenu";
import type { Town } from "./game/scenes/Town";

export default function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });
  const walkableScenes = ["Town", "Dungeon", "CozyCity", "Kanojedo"];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!phaserRef.current) return;

      let currentScene: Town | Dungeon | CozyCity | null = null;

      if (phaserRef.current.scene) {
        const sceneKey = phaserRef.current.scene.scene.key;
        if (!walkableScenes.includes(sceneKey)) return;

        currentScene = phaserRef.current.scene as Town | Dungeon | CozyCity;
      }

      if (!currentScene || !currentScene.playerMovement) return;

      currentScene.playerMovement.startRunAnimation();

      switch (event.key) {
        case "ArrowUp":
          currentScene.playerMovement.moveUp();
          break;
        case "ArrowDown":
          currentScene.playerMovement.moveDown();
          break;
        case "ArrowLeft":
          currentScene.playerMovement.moveLeft();
          break;
        case "ArrowRight":
          currentScene.playerMovement.moveRight();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!phaserRef.current) return;

      let currentScene: Town | Dungeon | CozyCity | null = null;

      if (phaserRef.current.scene) {
        const sceneKey = phaserRef.current.scene.scene.key;
        if (!walkableScenes.includes(sceneKey)) return;

        currentScene = phaserRef.current.scene as Town | Dungeon | CozyCity;
      }

      if (!currentScene || !currentScene.playerMovement) return;

      currentScene.playerMovement.startIdleAnimation();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div id="app">
      <WebSocketContext.Provider value={socket}>
        <PhaserGame
          ref={phaserRef}
          currentActiveScene={(scene: Phaser.Scene) => {}}
        />
      </WebSocketContext.Provider>
    </div>
  );
}
