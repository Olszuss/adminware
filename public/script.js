const a = document.querySelector(".menu-mobile");
const aItems = document.querySelectorAll(".menuItem");
const b = document.querySelector(".hamburger");
const c = document.querySelector(".closeIcon");
const aIcon = document.querySelector(".menuIcon");

function toggleMenu(event) {

  if (a.classList.contains("showMenu")) {
    a.classList.remove("showMenu");
    c.style.display = "none";
    aIcon.style.display = "block";
  } else {
    event.stopPropagation();
    a.classList.add("showMenu");
    c.style.display = "block";
    aIcon.style.display = "none";
  }
}

function closeMenuOutsideClick(event) {
  if (!a.contains(event.target) && a.classList.contains("showMenu")) {
    toggleMenu();
  }
}

b.addEventListener("click", toggleMenu);

aItems.forEach(function (aItem) {
  aItem.addEventListener("click", toggleMenu);
});

document.addEventListener("click", closeMenuOutsideClick);
