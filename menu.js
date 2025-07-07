const menuToggle = document.getElementById("menu-toggle");
if (menuToggle) {
  menuToggle.addEventListener("click", function () {
    const nav = document.getElementById("nav");
    nav.classList.toggle("active");
  });
}