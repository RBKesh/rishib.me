document.addEventListener('DOMContentLoaded', () => {

    /* --- Custom Cursor Logic --- */
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot follows immediately
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with slight delay (handled by CSS transition, we just update pos)
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Hover effects for cursor
    const hoverTriggers = document.querySelectorAll('[data-hover-trigger], a, button');

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', () => {
            document.body.classList.add('hovering');
        });
        trigger.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovering');
        });
    });

    /* --- Scroll Reveal Animation --- */
    const revealElements = document.querySelectorAll('.reveal-scroll');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target); // Trigger once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before element enters view completely
    });

    revealElements.forEach(el => revealObserver.observe(el));


    /* --- Smooth Scroll for Navigation --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    /* --- Dynamic Background Color Shift --- */
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.body.offsetHeight;

        // Define ranges for background colors based on sections
        // We can check if specific sections are in view
        const sections = ['hero', 'about', 'projects', 'contact'];

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const rect = section.getBoundingClientRect();
                // Check if section is primarily in view
                if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
                    // Update body background color based on section
                    switch (sectionId) {
                        case 'hero':
                            document.body.style.backgroundColor = 'var(--bg-hero)';
                            break;
                        case 'about':
                            document.body.style.backgroundColor = 'var(--bg-about)';
                            break;
                        case 'projects':
                            document.body.style.backgroundColor = 'var(--bg-projects)';
                            break;
                        case 'notes':
                            document.body.style.backgroundColor = 'var(--bg-notes)';
                            break;
                    }
                }
            }
        });
    });

    /* --- Drag & Drop for Sticky Notes --- */
    const notes = document.querySelectorAll('.sticky-note');
    const board = document.querySelector('.notes-board-container');

    let isDragging = false;
    let currentNote = null;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let maxZIndex = 10; // Start higher

    notes.forEach(note => {
        // Parse initial random skew/positions if needed, but we rely on CSS parsing

        note.addEventListener('mousedown', dragStart);

        // Touch events for mobile
        note.addEventListener('touchstart', dragStart, { passive: false });
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target.closest('.sticky-note')) {
            currentNote = e.target.closest('.sticky-note');

            // Bring to front
            maxZIndex++;
            currentNote.style.zIndex = maxZIndex;

            // Get current transform values to maintain them
            // We need to calculate offset relative to current position
            const style = window.getComputedStyle(currentNote);
            const matrix = new WebKitCSSMatrix(style.transform);

            // Store the initial offset of the mouse relative to the element's current translated position
            // But wait, our CSS uses top/left. We should probably switch to transform translate for performance?
            // Actually, mixing top/left with drag translate is tricky.
            // Let's use simple logic: offset from the *current* mouse pos vs *current* element pos.

            const rect = currentNote.getBoundingClientRect();
            const parentRect = board.getBoundingClientRect();

            // Calculate offset of mouse inside the element
            let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            xOffset = clientX - rect.left;
            yOffset = clientY - rect.top;

            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging && currentNote) {
            e.preventDefault();

            let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const parentRect = board.getBoundingClientRect();

            // Calculate new position relative to board
            let newX = clientX - parentRect.left - xOffset;
            let newY = clientY - parentRect.top - yOffset;

            // Boundary constraints (optional, but good)
            newX = Math.max(0, Math.min(newX, parentRect.width - currentNote.offsetWidth));
            newY = Math.max(0, Math.min(newY, parentRect.height - currentNote.offsetHeight));

            // Apply (using left/top is easier for persistent layouts without reset)
            currentNote.style.left = `${newX}px`;
            currentNote.style.top = `${newY}px`;
            currentNote.style.transform = 'scale(1.05) rotate(0deg)'; // Temporarily straighten while dragging
        }
    }

    function dragEnd(e) {
        if (isDragging && currentNote) {
            // Restore rotation (or random one)
            const randomRot = Math.random() * 6 - 3; // -3 to 3 deg
            currentNote.style.transform = `rotate(${randomRot}deg)`;
        }
        initialX = 0;
        initialY = 0;
        isDragging = false;
        currentNote = null;
    }

    /* --- Modal Logic --- */
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body-content');
    const closeModalBtn = document.querySelector('.modal-close');

    // Data for projects
    const projectData = {
        'Smart Mirror': {
            title: 'Smart Mirror',
            imgCoords: 'linear-gradient(45deg, #4f46e5, #ec4899)',
            tags: ['Raspberry Pi', 'Python', 'APIs'],
            desc: `
                <p>A custom-built Smart Mirror powered by a Raspberry Pi and a repurposed iPad display. 
                It seamlessly integrates into daily life by displaying real-time information while functioning as a standard mirror.</p>
                <br>
                <p><strong>Key Integrations:</strong></p>
                <ul>
                    <li>Local Time & Weather</li>
                    <li>News Headlines</li>
                    <li>Personal Calendar</li>
                </ul>
                <br>
                <p>Built with a modular architecture allowing for easy addition of new widgets and APIs.</p>
            `
        },
        'Open Source Recycled Plastic Pelletizer': {
            title: 'Open Source Recycled Plastic Pelletizer',
            imgCoords: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
            tags: ['Hardware', 'Engineering', 'Sustainability'],
            desc: `
                <p>An open-source machine designed to convert plastic waste into usage 3D printing filament. 
                This project aims to democratize recycling and reduce plastic pollution through accessible hardware.</p>
                <br>
                <p><strong>Key Features:</strong></p>
                <ul>
                    <li>Precise temperature control needed for consistent extrusion</li>
                    <li>Motor control for uniform filament diameter</li>
                    <li>Open hardware design for community replication</li>
                </ul>
            `
        },
        'Zen Portfolio': {
            title: 'Zen Portfolio',
            imgCoords: 'linear-gradient(45deg, #8b5cf6, #d946ef)',
            tags: ['HTML', 'CSS', 'Vanilla JS'],
            desc: `
                <p>A minimalist portfolio template focusing on typography and whitespace. 
                Designed for photographers and copywriters.</p>
                <br>
                <p><strong>Key Features:</strong></p>
                <ul>
                    <li>Zero dependencies</li>
                    <li>Perfect Lighthouse score</li>
                    <li>Accessible color contrast</li>
                </ul>
            `
        }
    };

    // Attach click events to "View Project" links
    // Note: In HTML, the links are currently generic. Let's find the parent card to know which project.
    document.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const card = link.closest('.project-card');
            const title = card.querySelector('.project-title').innerText;

            const data = projectData[title];
            if (data) {
                openModal(data);
            }
        });
    });

    function openModal(data) {
        // Construct HTML
        const html = `
            <div style="width: 100%; height: 250px; background: ${data.imgCoords}; border-radius: 12px; margin-bottom: 20px;"></div>
            <h2 class="modal-title">${data.title}</h2>
            <div class="modal-tags">
                ${data.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
            </div>
            <div class="modal-desc">
                ${data.desc}
            </div>
        `;

        modalBody.innerHTML = html;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    });

    // Close on clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

});
