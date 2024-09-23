document.getElementById("cloneButton").addEventListener("click", async() => {
    // Send a message to the content script to start the cloning process
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js'],
        });
    });
});