const naruto = document.getElementById('naruto'); 
const fireball = document.getElementById('fireball'); 
const score = document.getElementById('score'); 

function jump() {
    naruto.classList.add('jump-animation'); 
    setTimeout(() => {
        naruto.classList.remove('jump-animation'); 
    }, 500); 
}

document.addEventListener('keypress', () => {
    if (!naruto.classList.contains('jump-animation')){
    jump();
}
});

setInterval(() => {
    const dinoTop = parseInt(window.getComputedStyle(naruto)
      .getPropertyValue('top'));
    const fireballLeft = parseInt(window.getComputedStyle(fireball)
      .getPropertyValue('left'));
    score.innerText++;
  
    if (fireballLeft < -5) {
      fireball.style.display = 'none';
    } else {
      fireball.style.display = ''
    }
  
    if (fireballLeft < 50 && fireballLeft > 0 && dinoTop > 150) {
      alert("You got a score of: " + score.innerText +
        "\n\nPlay again?");
      location.reload();
    }
  }, 50);