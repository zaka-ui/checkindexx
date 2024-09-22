const popUpMessageComponent = (popUpMessage, popUp, body) => {
  popUp.style.display = "block";
  body.style.overflowY = "hidden";
  // Create the HTML content for the pop-up
  const popUpContent = `
      <div>
      <div class="pop-up-content">
      <span class="close-btn">Close</span>
        <p class="pop-up-message">
          ${popUpMessage} please try again
        </p>
      </div>
      </div>
     
      <div class="display"></div>
    `;

  // Render the pop-up content to the DOM
  popUp.innerHTML = popUpContent;

  // Now that the content is rendered, we can attach the event listener
  document.querySelector(".close-btn").addEventListener("click", () => {
    console.log("clicked");
    popUp.style.display = "none";
    body.style.overflowY = "scroll";
  });

  // Optionally return the content (although it might not be necessary)
  return popUpContent;
};

export default popUpMessageComponent;
