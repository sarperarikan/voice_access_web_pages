(function () {
  let interactiveElements;
  let currentIndex = 0;
  let microphoneEnabled = false;

  // Function to select all focusable elements on the page
  function updateInteractiveElements() {
    interactiveElements = document.querySelectorAll(`
      a[href], 
      button, 
      input, 
      textarea, 
      select, 
      details, 
      [tabindex]:not([tabindex="-1"])`
    );
  }

  // Function to activate the currently focused element
  function activateFocusedElement() {
    const activeElement = interactiveElements[currentIndex];

    if (activeElement) {
      if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') {
        activeElement.click();  // Simulate a click event for buttons and links
      }

      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        activeElement.focus();  // Focus on the input or textarea for typing
      }

      if (activeElement.tagName === 'SELECT') {
        activeElement.focus();  // Focus on select elements
      }
    }
  }

  // Function to focus on the next interactive element
  function goToNextElement() {
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].classList.remove('active');
    }
    currentIndex = (currentIndex + 1) % interactiveElements.length;
    
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].focus();
      interactiveElements[currentIndex].classList.add('active');
    }
  }

  // Function to focus on the previous interactive element
  function goToPreviousElement() {
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].classList.remove('active');
    }
    currentIndex = (currentIndex - 1 + interactiveElements.length) % interactiveElements.length;
    
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].focus();
      interactiveElements[currentIndex].classList.add('active');
    }
  }

  // Function to simulate Enter key press via a KeyboardEvent
  function simulateEnterKey() {
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true });
    document.dispatchEvent(enterEvent);  // Dispatch the event globally
    console.log("Simulated Enter key press.");
  }

  // Function to handle Enter keypress for activating focused elements
  function handleEnterKey(event) {
    if (event.key === 'Enter') {
      const focusedElement = document.activeElement;  // Get the currently focused element
      if (focusedElement.tagName === 'BUTTON' || focusedElement.tagName === 'A') {
        focusedElement.click();  // Simulate click for buttons and links
      } else if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
        focusedElement.focus();  // Focus on input or textarea for typing
      } else if (focusedElement.closest('form')) {
        focusedElement.closest('form').submit();  // Submit form if it's inside a form
      }
    }
  }

  // Function to move focus and scroll to the top of the page
  function goToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    currentIndex = 0;
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].focus();
      interactiveElements[currentIndex].classList.add('active');
    }
  }

  // Function to move focus and scroll to the bottom of the page
  function goToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    currentIndex = interactiveElements.length - 1;
    if (interactiveElements[currentIndex]) {
      interactiveElements[currentIndex].focus();
      interactiveElements[currentIndex].classList.add('active');
    }
  }

  // Function to show the detected command
  function showDetectedCommand(command) {
    const detectedCommandDisplay = document.getElementById('detectedCommand');
    if (detectedCommandDisplay) {
      detectedCommandDisplay.innerText = `Detected Command: ${command}`;
    }
  }

  // Voice command dataset
  const commandDataset = {
    'next element': goToNextElement,
    'previous element': goToPreviousElement,
    'enter': simulateEnterKey,  // Simulate 'enter' key press using voice command
    'top of page': goToTop,
    'bottom of page': goToBottom,
  };

  // Normalize commands to handle case-insensitive matching
  const normalizedCommandDataset = {};
  Object.keys(commandDataset).forEach(command => {
    normalizedCommandDataset[command.toLowerCase()] = (...args) => {
      showDetectedCommand(command);
      commandDataset[command](...args);
    };
  });

  // Function to start listening continuously
  function startListening() {
    if (annyang) {
      annyang.addCommands(normalizedCommandDataset);

      annyang.addCallback('end', function () {
        if (microphoneEnabled) {
          annyang.start();
        }
      });

      annyang.start();
      document.getElementById('voiceStatus').innerText = 'You can control by voice';
      updateAriaLive("Voice interface active");
      showMessage("Voice interface is active.");
    }
  }

  // Function to stop listening
  function stopListening() {
    if (annyang) {
      annyang.abort();
    }
    document.getElementById('voiceStatus').innerText = '';
    document.getElementById('detectedCommand').innerText = '';
    updateAriaLive("Voice interface off");
    showMessage("Voice interface is off.");
  }

  // Toggle microphone button
  function toggleMicrophone() {
    microphoneEnabled = !microphoneEnabled;
    const voiceToggle = document.getElementById('voiceToggle');
    
    if (microphoneEnabled) {
      startListening();
      voiceToggle.innerHTML = '<i class="fas fa-microphone-slash"></i> Voice Commands Active';
      voiceToggle.setAttribute('aria-pressed', 'true');
    } else {
      stopListening();
      voiceToggle.innerHTML = '<i class="fas fa-microphone"></i> Activate Voice Commands';
      voiceToggle.setAttribute('aria-pressed', 'false');
    }
  }

  // Function to update ARIA live region for screen readers
  function updateAriaLive(message) {
    const ariaLiveFeedback = document.getElementById('aria-live-feedback');
    if (ariaLiveFeedback) {
      ariaLiveFeedback.innerText = message;
    } else {
      console.error('ARIA live feedback element not found.');
    }
  }

  // Function to show a message on the screen
  function showMessage(message) {
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.innerText = message;
    } else {
      console.error('Feedback element not found.');
    }
  }

  // Add keydown listener for Enter key
  window.addEventListener('keydown', handleEnterKey);

  // Create a toggle button for voice control
  window.addEventListener('DOMContentLoaded', (event) => {
    // Update the interactive elements list
    updateInteractiveElements();

    const header = document.querySelector('header');
    if (header) {
      const toggleButton = document.createElement('button');
      toggleButton.id = 'voiceToggle';
      toggleButton.classList.add('voice-control-btn');
      toggleButton.innerHTML = '<i class="fas fa-microphone"></i> Activate Voice Commands';
      toggleButton.setAttribute('role', 'button');
      toggleButton.setAttribute('aria-pressed', 'false');
      toggleButton.setAttribute('accesskey', 's');  // Shortcut key 's'
      toggleButton.addEventListener('click', toggleMicrophone);
      header.appendChild(toggleButton);

      const voiceStatus = document.createElement('div');
      voiceStatus.id = 'voiceStatus';
      header.appendChild(voiceStatus);

      const detectedCommandDisplay = document.createElement('div');
      detectedCommandDisplay.id = 'detectedCommand';
      detectedCommandDisplay.style.fontSize = '16px';
      detectedCommandDisplay.style.marginTop = '10px';
      header.appendChild(detectedCommandDisplay);

      // Add ARIA live region dynamically to the header
      const ariaLiveFeedback = document.createElement('div');
      ariaLiveFeedback.id = 'aria-live-feedback';
      ariaLiveFeedback.classList.add('aria-live');
      ariaLiveFeedback.setAttribute('aria-live', 'polite');
      header.appendChild(ariaLiveFeedback);
    } else {
      console.error('Header element not found.');
    }
  });

  // MutationObserver to track DOM changes
  window.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      const observer = new MutationObserver(() => {
        updateInteractiveElements();
      });

      // Observe changes in the document body
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      console.error('Body element not found.');
    }
  });

})();
