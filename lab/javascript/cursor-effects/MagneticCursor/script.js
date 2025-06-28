console.clear();

const cursorElement = document.querySelector(".cursor");
const targetElements = document.querySelectorAll(".target");

class Cursor {
  constructor(el) {
    this.el = el;
    this.bind();
  }

  bind() {
    document.addEventListener("mousemove", this.move.bind(this), false);
  }

  move(e) {
    const cursorPosition = {
      left: e.clientX,
      top: e.clientY
    };

    targetElements.forEach((singleTarget) => {
      const triggerDistance = singleTarget.getBoundingClientRect().width;
      const targetPosition = {
        left: singleTarget.getBoundingClientRect().left + singleTarget.getBoundingClientRect().width / 2,
        top: singleTarget.getBoundingClientRect().top + singleTarget.getBoundingClientRect().height / 2
      };

      const distance = {
        x: targetPosition.left - cursorPosition.left,
        y: targetPosition.top - cursorPosition.top
      };

      const angle = Math.atan2(distance.x, distance.y);
      const hypotenuse = Math.sqrt(distance.x * distance.x + distance.y * distance.y);
      const textElement = singleTarget.querySelector(".text");

      if (hypotenuse < triggerDistance) {
        // Animate cursor to snap to the target
        gsap.to(this.el, {
          duration: 0.2,
          left: targetPosition.left - (Math.sin(angle) * hypotenuse) / 2,
          top: targetPosition.top - (Math.cos(angle) * hypotenuse) / 2,
          height: singleTarget.clientHeight,
          width: singleTarget.clientWidth
        });
        
        // Animate text to move away from cursor
        gsap.to(textElement, {
          duration: 0.2,
          x: -((Math.sin(angle) * hypotenuse) / 2),
          y: -((Math.cos(angle) * hypotenuse) / 2)
        });

      } else {
        // Animate cursor back to default state
        gsap.to(this.el, {
          duration: 0.2,
          left: cursorPosition.left,
          top: cursorPosition.top,
          height: "12px",
          width: "12px"
        });

        // Animate text back to center
        gsap.to(textElement, {
          duration: 0.2,
          x: 0,
          y: 0
        });
      }
    });
  }
}

const cursor = new Cursor(cursorElement);