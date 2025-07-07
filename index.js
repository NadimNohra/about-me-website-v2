/*#region Global Variables*/
let mouseTooltip;
let mouseTooltipTriggers;
let mouseTooltipText;
let mouseX;
let mouseY;
let centerX = window.innerWidth / 2;
let centerY = window.innerHeight / 2;
let snapPoints = [];
let currentSlideIndex = 0;
let overallAnimationSpeed = 6;
let arrowNavigation = false;
let lastWidth = window.innerWidth;
let reloadInbound = false;
let cursorVisible = true;
let isMobile = false
/*#endregion Global Variables*/

/*region Load*/
document.addEventListener("DOMContentLoaded", (event) => {

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  setVariables();

  GsapAnimationsInit();

  setEventListeners();

  //when reloading resume the scroll position
  currentScrollY = sessionStorage.getItem('currentScrollY');
  if (currentScrollY) {
    gsap.to(window, { duration: 0, scrollTo: currentScrollY });
  }

  //only show instruction once
  if (sessionStorage.getItem("instructionsShown") == "true") {
    hideInstructions(false);
  }

  if(isMobile) {
    document.getElementById("mobileMessage").style.display = 'flex'
  }

});
function setVariables() {
  
  mouseTooltip = document.getElementById("mouseTooltip");
  
  mouseTooltipTriggers = document.querySelectorAll('.show-tooltip-on-hover');
  
  mouseTooltipText = document.getElementById("mouseTooltipText");

  isMobile = window.innerWidth < 992
  
}

function GsapAnimationsInit() {
  let slides;
  let backgroundSlides;
  let snapProximity;

  //use gsap utils for setting animation to all slides using a variable
  slides = gsap.utils.toArray(".slide");
  backgroundSlides = gsap.utils.toArray(".slide-background");

  //making an array going from 0 to 1 to put custom snap points
  for (let i = 0; i < slides.length; i++) {
    snapPoints[i] = (1 / (slides.length - 1)) * i;
  }

  //how close the scroll position has to be to the next snap point for it to snap
  snapProximity = 0.6 / slides.length;

  //sets animation to the foreground, putting them all side by side, and moving them left the more you scroll
  //note that we are taking .horizontal-scroller-container as reference since it is 100vw where foreground slides are 200vh to make the foreground move faster, making it appear closer
  gsap.to(slides, {
    xPercent: -100 * (slides.length - 1),
    ease: "none",
    overwrite: true,
    scrollTrigger: {
      trigger: ".horizontal-scroller-container",
      scrub: 0.8,
      pin: true,
      snap: (value) => {
        for (let i = 0; i < snapPoints.length; i++) {
          if (
            value > snapPoints[i] - snapProximity &&
            value < snapPoints[i] + snapProximity
          ) {
            currentSlideIndex = i
            return snapPoints[i];
          }
        }
      },
      end: () =>
        "+=" +
        document.querySelector(".horizontal-scroller-container").offsetWidth *
        overallAnimationSpeed,
    },
    overwrite: true,
  });

  //sets animation to the background slides similar to slides
  gsap.to(backgroundSlides, {
    xPercent: -100 * (slides.length - 1),
    ease: "none",
    overwrite: true,
    scrollTrigger: {
      trigger: ".horizontal-scroller-container",
      scrub: 0.8,
      pin: slides,
      end: () =>
        "+=" +
        document.querySelector(".horizontal-scroller-container").offsetWidth *
        overallAnimationSpeed,
    },
    overwrite: true,
  });
}

function setEventListeners() {

  window.addEventListener("mousemove", function (event) {

    onMouseMovement(event);

  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      scrollToPreviousSlide();
    } else if (event.key === 'ArrowRight') {
      scrollToNextSlide();
    } else if (event.key === 'ArrowUp') {
      scrollToPreviousSlide();
    } else if (event.key === 'ArrowDown') {
      scrollToNextSlide();
      
    }
  });

  window.addEventListener('resize', !isMobile ? updateWindowDimensions : null);

  window.addEventListener('scroll', function () {

    //keeps track of scroll position
    if (!reloadInbound) {
      sessionStorage.setItem('currentScrollY', window.scrollY || window.pageYOffset || document.documentElement.scrollTop)
    }
    //check if mouse is over an element with tooltip trigger as scrolling does not trigger mousemove event
    if (!isMouseOverElementWithTooltip()) {
      hideTooltip();
    }

    hideInstructions()
  });

  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'h') {
      cursorVisible = !cursorVisible;
      setMouseVisibility(cursorVisible);
    }
    
  });

}
/*endregion Load*/

/*region Slides Functions*/

//event variable is unused, but with functions called by event listeners, at somepoint might be used
function updateSlidesPosition(event) {

  //calculates the distance from the mouse to the center
  const x = mouseX - centerX;
  const y = mouseY - centerY;

  //move the background / foreground the inverse of the variable calculated eariler
  gsap.to(".slide-text-container", {
    duration: 0.2,
    x: -x / 15,
    y: -y / 15,
    overwrite: true,
  });
  //dividing less to make it move more
  gsap.to(".slide-background-inside", {
    duration: 0.2,
    x: -x / 5,
    y: -y / 5,
    overwrite: true,
  });

}

function scrollToNextSlide() {
  if (currentSlideIndex < document.querySelectorAll('.slide').length - 1) {
    gsap.to(window, { duration: 0.5, scrollTo: '+=' + document.querySelector(".horizontal-scroller-container").offsetWidth / overallAnimationSpeed * 2 });
    setArrowNavigation(true);
    hideInstructions();
  }
}

function scrollToPreviousSlide() {
  if (currentSlideIndex > 0) {
    gsap.to(window, { duration: 0.5, scrollTo: '-=' + document.querySelector(".horizontal-scroller-container").offsetWidth / overallAnimationSpeed * 2 });
    setArrowNavigation(true);
      hideInstructions();
  }
}

function setArrowNavigation(bool) {

  // if swtiching from arrow navigation from false to true show the cursor again
  // else set set cursor visibility to the inverse of arrow navigation

  if (arrowNavigation && !bool & !cursorVisible){
    setMouseVisibility(true)
  } else if (bool || cursorVisible) {
    setMouseVisibility(!bool)
  }
  
  arrowNavigation = bool;
  
  //update slides and mouse variable with an object simulating the mouse being in the middle, to center the slides and background slides 
  let fakeEvent = {}
  fakeEvent.clientX = window.innerWidth / 2;
  fakeEvent.clientY = window.innerHeight / 2;
  updateMouseVariables(fakeEvent);
  updateSlidesPosition(fakeEvent);
}

function recalibrate() {
  document.getElementById("waring-reloading").style.display = 'flex'
  reloadInbound = true;
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

function updateWindowDimensions() {
  if (window.innerWidth !== lastWidth) {
    recalibrate();
  }
}

function onMouseMovement(event) {

  if (!isMobile)
    setArrowNavigation(false);

  updateMouseVariables(event);
  
  if (!isMobile)
    updateSlidesPosition(event);

  updateTooltip(event)
}

function updateMouseVariables(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function setMouseVisibility(visibility) {
  cursorVisible = visibility;
  if (cursorVisible) {
    document.body.classList.remove("hide-cursor");
  } else {
    document.body.classList.add("hide-cursor");
  }
}
/*endregion Slides Functions*/

/*region Tooltips And Messages*/
function showTooltip() {
  if (!mouseTooltip.classList.contains('shown')) {
    mouseTooltip.classList.add('shown');
    gsap.to(mouseTooltip, {
      duration: 0.5,
      y: 0,
      ease: "power2.out"
    });
  }
}

function hideTooltip() {
  if (mouseTooltip.classList.contains('shown')) {
    mouseTooltip.classList.remove('shown');
    gsap.to(mouseTooltip, {
      duration: !isMobile ? 0.5 : 0,
      y: 100,
      ease: "power2.out"
    });
  }
}

function setTooltipMessage(message) {
  mouseTooltipText.innerHTML = message;
}

function updateTooltip(event) {

  //update visibility + message
  if (event.target.classList.contains('show-tooltip-on-hover') && event.target.hasAttribute('data-tooltip-message')) {

    setTooltipMessage(event.target.getAttribute('data-tooltip-message'));
    showTooltip();

  } else {
    if (mouseTooltip.classList.contains('shown')) {
      hideTooltip();
    }
  }

  //update Postion
  mouseTooltip.style.left = `${mouseX - (mouseTooltip.clientWidth / 2)}px`;
  mouseTooltip.style.top = `${mouseY - (mouseTooltip.clientHeight)}px`;

  if (event.target.classList.contains('show-tooltip-on-hover')) {
    const tooltipTriggerRect = event.target.getBoundingClientRect();
    const tooltipTriggerCenterX = mouseX - (tooltipTriggerRect.left + tooltipTriggerRect.width / 2);
    const tooltipTriggerCenterY = mouseY - (tooltipTriggerRect.top + tooltipTriggerRect.height / 2);

    if (!isMobile) {
      gsap.to(mouseTooltip, {
        duration: 0.2,
        x: tooltipTriggerCenterX / 3,
        y: (tooltipTriggerCenterY / 3) - tooltipTriggerRect.height / 5,
        overwrite: true,
      });
    }
  }
}

function isMouseOverElementWithTooltip() {
  const elements = document.querySelectorAll('.show-tooltip-on-hover');

  for (let element of elements) {
      if (element.hasAttribute('data-tooltip-message')) {
          const rect = element.getBoundingClientRect();
          
          if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
              return true; 
          }
      }
  }
  return false;
}

function hideInstructions(withAnimation = true){
  if (document.getElementById("arrowTooltip") && document.getElementById("hInstructions")) {  
    if (withAnimation) {  
      setTimeout(() => {
        document.getElementById("arrowTooltip").classList.add("hidden");
        document.getElementById("hInstructions").classList.add("hidden");
        sessionStorage.setItem("instructionsShown", "true");
      }, 1000);
    } else {
      document.getElementById("arrowTooltip").remove();
      document.getElementById("hInstructions").remove();
    }
  }
}
/*endregion Tooltips And Messages*/

//remove loading screen
window.addEventListener('load', function () {
  gsap.to("#loading-screen", {
    opacity: 0,
    ease: "power3"
  });
  document.getElementById("loading-screen").style.zIndex = "-1";
});