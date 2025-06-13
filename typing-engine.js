class TypingEngine {
  constructor(module, practice) {
    this.module = module;
    this.practice = practice;
    this.text = "";
    this.startTime = null;
    this.input = "";
    this.wpm = 0;
    this.accuracy = 0;
  }

  async loadText() {
    try {
      const response = await fetch(`/api/typing-tests/${this.module}/${this.practice}`);
      if (!response.ok) throw new Error("Failed to fetch typing text");
      this.text = await response.text();
    } catch (error) {
      console.error("Error loading text:", error);
      this.text = "Fallback text for offline mode.";
    }
  }

  startTest() {
    this.startTime = Date.now();
    this.input = "";
  }

  updateInput(newInput) {
    this.input = newInput;
    this.calculateWPM();
    this.calculateAccuracy();
  }

  calculateWPM() {
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    const wordCount = this.input.split(" ").length;
    this.wpm = Math.round(wordCount / elapsedMinutes);
  }

  calculateAccuracy() {
    const correctChars = this.input.split("").filter((char, index) => char === this.text[index]).length;
    this.accuracy = Math.round((correctChars / this.text.length) * 100);
  }

  async submitProgress() {
    try {
      const response = await fetch(`/api/progress/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: this.module, practice: this.practice, wpm: this.wpm, accuracy: this.accuracy })
      });
      if (!response.ok) throw new Error("Failed to submit progress");
      console.log("Progress submitted successfully");
    } catch (error) {
      console.error("Error submitting progress:", error);
    }
  }
}

export default TypingEngine;
