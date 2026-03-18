const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

if (menuToggle && nav) {
  const setExpanded = (isExpanded) => {
    menuToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  };

  setExpanded(nav.classList.contains("active"));

  menuToggle.addEventListener("click", function () {
    const nextExpanded = menuToggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("active", nextExpanded);
    setExpanded(nextExpanded);
  });
}
