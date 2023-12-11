const a = document.querySelector(".menu-mobile");
const aItems = document.querySelectorAll(".menuItem");
const b = document.querySelector(".hamburger");
const c = document.querySelector(".closeIcon");
const aIcon = document.querySelector(".menuIcon");

function toggleMenu() {
  if (a.classList.contains("showMenu")) {
    a.classList.remove("showMenu");
    c.style.display = "none";
    aIcon.style.display = "block";
  } else {
    a.classList.add("showMenu");
    c.style.display = "block";
    aIcon.style.display = "none";
  }
}

b.addEventListener("click", toggleMenu);
aItems.forEach(function (aItem) {
  aItem.addEventListener("click", toggleMenu);
});