import { useEffect, useRef, useState } from "react";
import { WebSocketContext, socket } from "./contexts/WebSocketContext";
import { EventBus } from "./game/EventBus";
import { type IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import type { Dungeon } from "./game/scenes/Dungeon";
import type { MainMenu } from "./game/scenes/MainMenu";
import type { Town } from "./game/scenes/Town";
import type { CozyCity } from "./game/scenes/CozyCity";

export default function App() {
  const [canMoveSprite, setCanMoveSprite] = useState(true);
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });
  const walkableScenes = ["Town", "Dungeon", "CozyCity"];

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  useEffect(() => {
    const handlePositionUpdate = (position: { x: number; y: number }) => {
      setSpritePosition(position);
    };

    EventBus.on("player-position-updated", handlePositionUpdate);

    return () => {
      EventBus.off("player-position-updated", handlePositionUpdate);
    };
  }, []);

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

  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  return (
    <div id="app">
      <WebSocketContext.Provider value={socket}>
        <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        <div>
          <div>
            <button className="button" onClick={changeScene} type="button">
              Change Scene
            </button>
          </div>
          <div className="spritePosition">
            Sprite Position:
            <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
          </div>
        </div>
      </WebSocketContext.Provider>
    </div>
  );
}
