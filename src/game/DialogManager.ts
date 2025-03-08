import type { GameObjects, Scene } from "phaser";
import { EventBus } from "./EventBus";

export interface Dialog {
  npcName: string;
  messages: string[];
  responses?: DialogResponse[];
}

interface DialogResponse {
  text: string;
  next?: Dialog;
  action?: () => void;
}

export class DialogManager {
  private scene: Scene;
  private dialogBox: GameObjects.Container;
  private dialogText: GameObjects.Text;
  private nameText: GameObjects.Text;
  private continueText: GameObjects.Text;
  private responseTexts: GameObjects.Text[] = [];

  private currentDialog: Dialog | null = null;
  private currentMessageIndex = 0;
  private isDialogActive = false;
  private selectedResponseIndex = 0;

  private keyDownHandler: (event: KeyboardEvent) => void;
  private keyUpHandler: (event: KeyboardEvent) => void;

  constructor(scene: Scene) {
    this.scene = scene;
    this.createDialogBox();

    this.keyDownHandler = this.handleKeyDown.bind(this);

    EventBus.emit("dialog-manager-ready", this);
  }

  private createDialogBox(): void {
    this.dialogBox = this.scene.add.container(400, 500);
    this.dialogBox.setDepth(1000);
    this.dialogBox.setVisible(false);

    const background = this.scene.add.rectangle(0, 0, 700, 150, 0x000000, 0.7);
    background.setStrokeStyle(2, 0xffffff);
    this.dialogBox.add(background);

    const nameBackground = this.scene.add.rectangle(
      -300,
      -60,
      100,
      30,
      0x000000,
      0.9,
    );
    nameBackground.setStrokeStyle(1, 0xffffff);
    this.dialogBox.add(nameBackground);

    this.nameText = this.scene.add.text(-350, -70, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    });
    this.nameText.setOrigin(0, 0);
    this.dialogBox.add(this.nameText);

    this.dialogText = this.scene.add.text(-325, -35, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: 650 },
    });
    this.dialogBox.add(this.dialogText);

    this.continueText = this.scene.add.text(
      300,
      50,
      "Press SPACE to continue",
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      },
    );
    this.continueText.setOrigin(1, 0);
    this.dialogBox.add(this.continueText);
  }

  public showDialog(dialog: Dialog): void {
    this.currentDialog = dialog;
    this.currentMessageIndex = 0;
    this.isDialogActive = true;
    this.dialogBox.setVisible(true);

    this.displayCurrentMessage();

    document.addEventListener("keydown", this.keyDownHandler);
    document.addEventListener("keyup", this.keyUpHandler);

    EventBus.emit("dialog-started", dialog.npcName);
  }

  private displayCurrentMessage(): void {
    if (!this.currentDialog) return;

    this.nameText.setText(this.currentDialog.npcName);

    const currentMessage =
      this.currentDialog.messages[this.currentMessageIndex];
    this.dialogText.setText(currentMessage);

    const showResponses =
      this.currentMessageIndex === this.currentDialog.messages.length - 1 &&
      this.currentDialog.responses &&
      this.currentDialog.responses.length > 0;

    this.continueText.setVisible(!showResponses);

    if (showResponses && this.currentDialog.responses) {
      this.displayResponses(this.currentDialog.responses);
    } else {
      this.clearResponses();
    }
  }

  private displayResponses(responses: DialogResponse[]): void {
    this.clearResponses();
    this.selectedResponseIndex = 0;

    responses.forEach((response, index) => {
      const yPos = 10 + index * 25;
      const text = this.scene.add.text(
        -300,
        yPos,
        `${index === this.selectedResponseIndex ? "> " : "  "}${response.text}`,
        {
          fontFamily: "Arial",
          fontSize: "16px",
          color: index === this.selectedResponseIndex ? "#ffff00" : "#ffffff",
        },
      );

      this.dialogBox.add(text);
      this.responseTexts.push(text);
    });
  }

  private clearResponses(): void {
    this.responseTexts.forEach((text) => {
      text.destroy();
    });
    this.responseTexts = [];
  }

  private updateResponseSelection(): void {
    if (!this.currentDialog || !this.currentDialog.responses) return;

    this.responseTexts.forEach((text, index) => {
      const dialog = this.currentDialog;
      if (!dialog?.responses) return;
      if (index >= dialog.responses.length) return;

      text.setText(
        `${index === this.selectedResponseIndex ? "> " : "  "}${dialog.responses[index].text}`,
      );
      text.setColor(
        index === this.selectedResponseIndex ? "#ffff00" : "#ffffff",
      );
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isDialogActive) return;

    const showingResponses = this.responseTexts.length > 0;

    if (showingResponses) {
      switch (event.key) {
        case "ArrowUp":
          this.selectedResponseIndex = Math.max(
            0,
            this.selectedResponseIndex - 1,
          );
          this.updateResponseSelection();
          break;
        case "ArrowDown":
          this.selectedResponseIndex = Math.min(
            this.responseTexts.length - 1,
            this.selectedResponseIndex + 1,
          );
          this.updateResponseSelection();
          break;
        case "Enter":
        case " ":
          this.selectResponse();
          break;
      }
    } else {
      if (event.key === " " || event.key === "Enter") {
        if (
          this.currentDialog &&
          this.currentMessageIndex < this.currentDialog.messages.length - 1
        ) {
          this.currentMessageIndex++;
          this.displayCurrentMessage();
        } else if (
          !this.currentDialog?.responses ||
          this.currentDialog.responses.length === 0
        ) {
          this.closeDialog();
        }
      }
    }
  }

  private selectResponse(): void {
    if (!this.currentDialog || !this.currentDialog.responses) return;

    const selectedResponse =
      this.currentDialog.responses[this.selectedResponseIndex];

    if (selectedResponse.next) {
      this.showDialog(selectedResponse.next);
    } else {
      this.closeDialog();
    }

    if (selectedResponse.action) {
      selectedResponse.action();
    }
  }

  private closeDialog(): void {
    this.isDialogActive = false;
    this.dialogBox.setVisible(false);
    this.clearResponses();

    document.removeEventListener("keydown", this.keyDownHandler);
    document.removeEventListener("keyup", this.keyUpHandler);

    EventBus.emit("dialog-ended");
  }

  public isActive(): boolean {
    return this.isDialogActive;
  }
}
