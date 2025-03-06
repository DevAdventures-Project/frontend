import { useEffect, useRef, useState } from "react";
import { type IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import type { MainMenu } from "./game/scenes/MainMenu";
import type { Town } from "./game/scenes/Town";

export default function App() {
  const speedMovement = 10;
  const [canMoveSprite, setCanMoveSprite] = useState(true);
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });
  const walkableScenes = ["Town", "Dungeon"];

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!phaserRef.current) return;

      const scene = phaserRef.current.scene as Town;
      if (!scene || !walkableScenes.includes(scene.scene.key)) return;

      scene.player?.anims.play("run", true);

      scene.movePlayer(({ x, y }) => {
        let newX = x;
        let newY = y;

        switch (event.key) {
          case "ArrowUp":
            newY -= speedMovement;
            break;
          case "ArrowDown":
            newY += speedMovement;
            break;
          case "ArrowLeft":
            newX -= speedMovement;
            break;
          case "ArrowRight":
            newX += speedMovement;
            break;
        }

        scene.updatePositionPlayer(newX, newY);
        setSpritePosition({ x: newX, y: newY });
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!phaserRef.current) return;

      const scene = phaserRef.current.scene as Town;
      if (!scene || !walkableScenes.includes(scene.scene.key)) return;
      scene.player?.anims.play("idle");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /*const moveSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene && scene.scene.key === "MainMenu") {
        
        scene.moveLogo(({ x, y }) => {
          setSpritePosition({ x, y });
        });
      }
    }
  };*/

  const addSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene;

      if (scene) {
        const x = Phaser.Math.Between(64, scene.scale.width - 64);
        const y = Phaser.Math.Between(64, scene.scale.height - 64);

        const star = scene.add.sprite(x, y, "star");

        scene.add.tween({
          targets: star,
          duration: 500 + Math.random() * 1000,
          alpha: 0,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  };

  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
      <div>
        <div>
          <button className="button" onClick={changeScene} type="button">
            Change Scene
          </button>
        </div>
        <div>
          <button disabled={canMoveSprite} className="button" type="button">
            Toggle Movement
          </button>
        </div>
        <div className="spritePosition">
          Sprite Position:
          <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
        </div>
        <div>
          <button className="button" onClick={addSprite} type="button">
            Add New Sprite
          </button>
        </div>
      </div>
    </div>
  );
}
