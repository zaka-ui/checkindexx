const submit = document.querySelector(".submit-btn");
const url = document.querySelector(".url");
const responseDiv = document.querySelector(".response");
const formContent = document.querySelector(".form-content");
const error = document.querySelector(".error");
const dataIsIndexed = document.querySelector(".dataIsIndexed");
const key = document.querySelector(".key");
const popUp = document.querySelector(".pop-up");
const body = document.querySelector("body");
import popUpMessageComponent from "./components/popUp.js";

let siteLink = "";
let sitemapLink = "";

let responseAfterFetch = "";
let responseOfIndex = "";
let captchaKey = "";

const isValidUrl = (siteLink) => {
  const regex =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-\.~!$&'()*+,;=:@%]*)*$/i;
  return regex.test(siteLink);
};

submit.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!isValidUrl(siteLink)) {
    error.innerText = "Please enter a valid link.";
    return;
  }

  sitemapLink = siteLink.endsWith("/")
    ? `${siteLink}page-sitemap.xml`
    : `${siteLink}/page-sitemap.xml`;

  try {
    submit.disabled = true;
    error.innerText = "";

    const response = await fetch("http://localhost:3000/send-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        captchaKey: captchaKey,
        sitemapLink: sitemapLink,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
      //popUpMessageComponent(response.message, popUp);
    }

    const data = await response.json();

    responseAfterFetch = data;

    responseDiv.innerHTML = `
      <div>
        <h2>Indexed Links</h2>
        <ul class="list">
          ${responseAfterFetch.results.indexedLinks
            .map(
              (indexedLink, index) => `
                <li class="link">
                  <input type="checkbox" id="${index}" class="checkbox" value="${indexedLink}">
                  <span>${indexedLink}</span>
                </li>
              `
            )
            .join("")}
        </ul>
      </div>
      <div class="nonIndexed">
        <h2>Non Indexed Links <span class="select-all">select All</span></h2>
        <ul>
          ${responseAfterFetch.results.nonIndexedLinks
            .map(
              (nonIndexedLink, index) => `
                <li>
                  <input type="checkbox" id="${
                    index + responseAfterFetch.results.indexedLinks.length
                  }" class="checkbox nonIndexedCheckbox" value="${nonIndexedLink}">
                  <span>${nonIndexedLink}</span>
                </li>
              `
            )
            .join("")}
        </ul>
        <div class="button-container">
          <p>Please choose the links before clicking the button and make sure that you have authorization.</p>
          <button class="send-links">Send indexation</button>
        </div>
      </div>
    `;

    submit.disabled = false;
    const selectAll = document.querySelector('.select-all');
    const sendLinks = document.querySelector(".send-links");
    selectAll.addEventListener('click', (e) => {
      const nonIndexedCheckBox = document.querySelectorAll('.nonIndexedCheckbox');
      nonIndexedCheckBox.forEach(box => {
        box.checked = !box.checked;
      });
    });
    sendLinks.addEventListener("click", async () => {
      const selectedLinks = Array.from(
        document.querySelectorAll(".checkbox:checked")
      ).map((checkbox) => checkbox.value);
      // Check if selectedLinks array is empty
      if (selectedLinks.length === 0) {
        //alert("Please select at least one link.");
        popUpMessageComponent("Please select at least one link.", popUp, body);

        return; // Exit the function early if array is empty
      }

      try {
        const indexResponse = await fetch("http://127.0.0.1:3000/index-links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            links: selectedLinks,
          }),
        });
      
        if (!indexResponse.ok) {
          throw new Error(
            "Network response was not ok " + indexResponse.statusText
          );
        }
      
        const indexData = await indexResponse.json();
        console.log("indexData:", indexData); // Log indexData to understand its structure
        popUpMessageComponent(indexData.response , popUp, body); // Join messages to display as single string
      
      } catch (error) {
        console.log(error);
        popUpMessageComponent(error.message, popUp, body);
      } finally {
        submit.disabled = false;
      }
    });
  } catch (error) {
    console.log(error.message);
    popUpMessageComponent(error.message, popUp, body);
  } finally {
    submit.disabled = false;
  }
});

url.addEventListener("change", (e) => {
  siteLink = e.target.value;
  //console.log(siteLink);
});

key.addEventListener("change", (e) => {
  captchaKey = e.target.value;
  //console.log(captchaKey);
});
