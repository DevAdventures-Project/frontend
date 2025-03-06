import { useEffect, useRef, useState } from "react";
import { type IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import type { MainMenu } from "./game/scenes/MainMenu";
import type { Town } from "./game/scenes/Town";

export default function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

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
      if (!scene || scene.scene.key !== "Town") return;

      scene.player?.play("run");

      scene.movePlayer(({ x, y }) => {
        let newX = x;
        let newY = y;

        switch (event.key) {
          case "ArrowUp":
            newY -= 10; // Move up
            break;
          case "ArrowDown":
            newY += 10; // Move down
            break;
          case "ArrowLeft":
            newX -= 10; // Move left
            break;
          case "ArrowRight":
            newX += 10; // Move right
            break;
        }

        scene.updatePositionPlayer(newX, newY); // call method of mainMenu scene that move player
        setSpritePosition({ x: newX, y: newY });
      });
    };

    const handleKeyUp = (event : KeyboardEvent) => {
      if (!phaserRef.current) return;
    
      const scene = phaserRef.current.scene as Town;
      if (!scene || scene.scene.key !== "Town") return;
      scene.player?.anims.play('idle');
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
        // Get the update logo position
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
        // Add more stars
        const x = Phaser.Math.Between(64, scene.scale.width - 64);
        const y = Phaser.Math.Between(64, scene.scale.height - 64);

        //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
        const star = scene.add.sprite(x, y, "star");

        //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
        //  You could, of course, do this from within the Phaser Scene code, but this is just an example
        //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
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

  // Event emitted from the PhaserGame component
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
