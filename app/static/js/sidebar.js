/* dark/light mode */
const darkModeToggle = document.querySelector('#dark-mode');
  
darkModeToggle.addEventListener('change', function() {
  document.body.classList.toggle('dark-mode');
});


/* random colors */
const hue = Math.floor(Math.random() * 360);
document.documentElement.style.setProperty(`--h`, hue);

// add profile picture and remove picture 
function loadFile(event) {
  var image = document.getElementById("output");
  image.src = URL.createObjectURL(event.target.files[0]);
  image.style.display = "block";
  document.getElementById("avatar").style.display = "none";
  document.getElementById("remove-image").style.display = "block";
  localStorage.setItem("profilePicture", image.src);
}

function removeImage() {
  document.getElementById("output").style.display = "none";
  document.getElementById("avatar").style.display = "block";
  document.getElementById("remove-image").style.display = "none";
  localStorage.removeItem("profilePicture");
}

window.onload = function() {
  var storedImage = localStorage.getItem("profilePicture");
  if (storedImage) {
    document.getElementById("output").src = storedImage;
    document.getElementById("output").style.display = "block";
    document.getElementById("avatar").style.display = "none";
    document.getElementById("remove-image").style.display = "block";
  }
};