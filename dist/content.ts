function isElement(node: any): node is Element {
    return node.classList !== undefined;
}

var observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (!mutation.addedNodes) {
            return;
        }

        for (var i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (!isElement(node)) {
                continue;
            }

            if (node.classList.contains("notion-page-content")) {
                const shareButton = Array.from(
                    document.querySelectorAll(".notion-topbar *")
                ).filter((x) => x.textContent === "Share")[0];

                const startButton = shareButton.cloneNode(true) as HTMLElement;
                startButton.addEventListener("click", start);
                startButton.textContent = "Slides";
                shareButton.parentNode?.prepend(startButton);
            }
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

var mainFrame: HTMLDivElement;
var data: any;

function start() {
    data = getSlides();

    if (mainFrame) {
        mainFrame.style.display = "flex";
        return;
    }

    mainFrame = document.createElement("div");
    mainFrame.style.position = "absolute";
    mainFrame.style.top = "0";
    mainFrame.style.bottom = "0";
    mainFrame.style.left = "0";
    mainFrame.style.right = "0";
    mainFrame.style.zIndex = "1000";
    mainFrame.style.backgroundColor = "white";
    mainFrame.style.overflow = "overlay";

    const closeIcon = document.createElement("div");
    closeIcon.style.position = "absolute";
    closeIcon.style.top = "50px";
    closeIcon.style.right = "50px";
    closeIcon.style.cursor = "pointer";
    closeIcon.style.fontSize = "48px";
    closeIcon.textContent = "♱";

    mainFrame.appendChild(closeIcon);

    closeIcon.addEventListener("click", () => {
        mainFrame.style.display = "none";
    });

    const $slide = document.createElement("div");
    $slide.style.width = "900px";
    $slide.style.padding = "20px";
    $slide.style.marginTop = "100px";
    $slide.style.marginLeft = "200px";
    mainFrame.appendChild($slide);

    let slideIndex = 0;
    let blockIndex = 0;

    document.body.appendChild(mainFrame);

    function move(dir: "backward" | "forward") {
        const dx = dir === "backward" ? -1 : 1;
        const slide = data[slideIndex];
        const newBlockIndex = blockIndex + dx;
        if (newBlockIndex < 0) {
            if (slideIndex - 1 < 0) {
                return;
            } else {
                slideIndex--;
                blockIndex = data[slideIndex].blocks.length - 1;
            }
        } else if (newBlockIndex >= slide.blocks.length) {
            if (slideIndex + 1 >= data.length) {
                return;
            } else {
                slideIndex++;
                blockIndex = 0;
            }
        } else {
            blockIndex = newBlockIndex;
        }

        render();
    }

    window.addEventListener("keydown", (ev) => {
        switch (ev.key) {
            case "ArrowLeft":
                move("backward");
                break;
            case "ArrowRight":
                move("forward");
                break;
        }
    });

    function render() {
        $slide.innerHTML = "";
        const slide = data[slideIndex];
        $slide.appendChild(slide.title.cloneNode(true));
        const block = slide.blocks[blockIndex];
        $slide.appendChild(block.title.cloneNode(true));
        for (const el of block.elements) {
            $slide.appendChild(el.cloneNode(true));
        }
    }
}

function getSlides() {
    const pageContent = document.querySelector(".notion-page-content")!;
    const slides: Slide[] = [];
    let currentSlide: Slide | undefined = undefined;
    let currentBlock: Block | undefined = undefined;
    for (const block of Array.from(pageContent.children)) {
        if (block.classList.contains("notion-header-block")) {
            if (currentSlide) {
                slides.push(currentSlide);
            }

            currentSlide = {
                title: block,
                blocks: [],
            };
        } else if (block.classList.contains("notion-sub_sub_header-block")) {
            if (currentBlock) {
                currentSlide?.blocks.push(currentBlock);
            }

            currentBlock = {
                title: block,
                elements: [],
            };
        } else {
            currentBlock?.elements.push(block);
        }
    }

    if (currentBlock) {
        currentSlide?.blocks.push(currentBlock);
    }

    if (currentSlide) {
        slides.push(currentSlide);
    }

    return slides;
}

interface Slide {
    title: Element;
    blocks: Block[];
}

interface Block {
    title: Element;
    elements: Element[];
}
