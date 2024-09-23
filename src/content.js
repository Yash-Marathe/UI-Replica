(async function downloadCompleteHTML() {

    // Helper function to fetch content of external files (CSS, images)
    async function fetchResource(url, isBinary = false) {
        try {
            const response = await fetch(url);
            if (isBinary) {
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                return await response.text();
            }
        } catch (error) {
            console.warn('Failed to fetch resource:', url);
            return '';
        }
    }

    // Helper function to inline external CSS and convert relative URLs to absolute
    async function inlineCSS(linkElement) {
        const href = linkElement.href;
        const cssContent = await fetchResource(href);

        // Resolve relative URLs within CSS (for images, fonts, etc.)
        const resolvedCSS = cssContent.replace(/url(?!['"]?(?:data|https?|ftp):)['"]?([^'")]+)['"]?/g, function(match, relativeUrl) {
            const absoluteUrl = new URL(relativeUrl, href).href;
            return `url(${absoluteUrl})`;
        });

        const styleElement = document.createElement('style');
        styleElement.textContent = resolvedCSS;
        return styleElement;
    }

    // Helper function to inline images
    async function inlineImages(element) {
        const images = element.querySelectorAll('img');
        for (let img of images) {
            if (img.src.startsWith('http')) {
                const dataUri = await fetchResource(img.src, true);
                img.src = dataUri; // Replace the src with base64-encoded data URI
            }
        }
    }

    // Get the entire DOM HTML structure
    const html = document.documentElement.outerHTML;

    // Create a new document to parse and modify the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Inline all external CSS files
    const linkElements = [...doc.querySelectorAll('link[rel="stylesheet"]')];
    for (let link of linkElements) {
        const inlineStyleElement = await inlineCSS(link);
        link.replaceWith(inlineStyleElement);
    }

    // Inline all images as base64 data URIs
    await inlineImages(doc);

    // Remove all <script> tags (external and inline)
    const scriptElements = [...doc.querySelectorAll('script')];
    scriptElements.forEach(script => script.remove());

    // Get the final HTML including the modified DOM
    const finalHTML = doc.documentElement.outerHTML;

    // Create a downloadable HTML file
    const downloadHTML = (content, fileName) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: "text/html" });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Download the final HTML file
    downloadHTML(finalHTML, "index.html");

})();