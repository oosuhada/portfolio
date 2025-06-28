const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    cards.forEach((c) => {
      if (c == card) c.classList.add("active");
      else c.classList.add("not-active");
    });
  });

  card.addEventListener("mouseleave", () => {
    cards.forEach((c) => {
      c.classList.remove("active", "not-active");
    });
  });
});