let transitionTriggered = false;
let autoTransitionTimeout;

function startTransition() {
  if (transitionTriggered) return; // Prevent running multiple times
  transitionTriggered = true;
  
  // Clear the automatic timer so it doesn't doublefire
  clearTimeout(autoTransitionTimeout);

  const helloWrapper = document.getElementById('hello-wrapper');
  const cubeCanvas = document.getElementById('game');
  
  if (helloWrapper) {
    helloWrapper.classList.add('fade-out');
    
    // Remove the window event listeners now that they are no longer needed
    window.removeEventListener('click', startTransition);
    window.removeEventListener('keydown', startTransition);
    window.removeEventListener('touchstart', startTransition);

    setTimeout(() => {
      helloWrapper.style.display = 'none';
      
      if (cubeCanvas) {
        cubeCanvas.style.display = 'block';
        cubeCanvas.offsetHeight; 
        cubeCanvas.style.opacity = '1';
      }
    }, 600);
  }
}

window.addEventListener('click', startTransition);
window.addEventListener('keydown', startTransition);
window.addEventListener('touchstart', startTransition); // Captures mobile taps

autoTransitionTimeout = setTimeout(startTransition, 6000);