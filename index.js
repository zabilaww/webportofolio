// Supabase Init
const SUPABASE_URL = 'https://tttsdivqlckeigowtlqu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dHNkaXZxbGNrZWlnb3d0bHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE4MzQ0MywiZXhwIjoyMDY2NzU5NDQzfQ.xO2uVz5--Y4dp9okjvMqBRh4SfKo73R1EPrmFppwEvA';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Inisialisasi Swiper
let swiper;

// DOM Loaded - Pastikan semua elemen HTML sudah dimuat sebelum menjalankan script
document.addEventListener('DOMContentLoaded', async () => {
    // Memuat data awal untuk setiap bagian
    await loadSection('about_me', 'about', renderAboutMe);
    await loadSection('projects', 'project', renderProject);
    await loadSection('experience', 'experience', renderExperience);
    await loadSection('activity', 'activity', renderActivity);

    // Mendengarkan perubahan realtime untuk setiap bagian
    listenRealtime('about_me', 'about', renderAboutMe);
    listenRealtime('projects', 'project', renderProject);
    listenRealtime('experience', 'experience', renderExperience);
    listenRealtime('activity', 'activity', renderActivity);

    // --- Perbaikan: Inisialisasi Event Listener untuk Menu Mobile (Hamburger Icon) ---
    const menuIcon = document.querySelector('#menu-icon');
    const navbar = document.querySelector('.navbar');

    if (menuIcon && navbar) {
        menuIcon.addEventListener('click', () => {
            navbar.classList.toggle('active'); // Menambah/menghapus kelas 'active' pada navbar
            // Opsional: Tutup menu jika mengklik di luar (jika diperlukan)
            // document.addEventListener('click', function handler(event) {
            //     if (!navbar.contains(event.target) && !menuIcon.contains(event.target)) {
            //         navbar.classList.remove('active');
            //         document.removeEventListener('click', handler);
            //     }
            // });
        });
    } else {
        console.warn("Menu icon or navbar not found. Mobile menu functionality might be affected.");
    }

    // Inisialisasi Dark Mode Toggle (sudah ada, hanya memastikan penempatan yang benar)
    const darkModeIcon = document.querySelector('#darkMode-icon');
    const body = document.body;

    // Simpan preferensi di localStorage
    if (localStorage.getItem('dark-mode') === 'enabled') {
        body.classList.add('dark-mode');
    }

    if (darkModeIcon) {
        darkModeIcon.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
            } else {
                localStorage.setItem('dark-mode', 'disabled');
            }
        });
    }
});

// Load Section - Memuat data dari Supabase dan merendernya
async function loadSection(table, sectionId, renderer) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return;
    }

    const container = document.getElementById(sectionId);
    if (!container) {
        console.warn(`Container with ID '${sectionId}' not found for table '${table}'.`);
        return;
    }

    if (sectionId === 'about') {
        renderAboutMe(data);
    } else if (sectionId === 'activity') {
        const testimonialWrapper = container.querySelector('.testimonial-wrapper');
        if (testimonialWrapper) {
            // --- Perbaikan: Memanggil renderActivity langsung untuk mendapatkan HTML ---
            testimonialWrapper.innerHTML = renderActivity(data);
            // --- Perbaikan: Inisialisasi Swiper setelah HTML dimasukkan ke DOM ---
            initializeSwiper();
        } else {
            console.warn(`Div with class 'testimonial-wrapper' not found inside section '#activity'.`);
        }
    } else if (sectionId === 'project') {
        const projectContainer = container.querySelector('.project-container');
        if (projectContainer) {
            projectContainer.innerHTML = renderProject(data);
        } else {
            console.warn(`Div with class 'project-container' not found inside section '#project'.`);
        }
    } else if (sectionId === 'experience') {
        // --- Perbaikan: Menggunakan .experience-container sesuai CSS ---
        const experienceContainer = container.querySelector('.experience-container');
        if (experienceContainer) {
            experienceContainer.innerHTML = renderExperience(data);
        } else {
            console.warn(`Div with class 'experience-container' not found inside section '#experience'.`);
        }
    }
}

// Initialize Swiper
function initializeSwiper() {
    // --- Perbaikan: Memastikan elemen Swiper ada sebelum inisialisasi ---
    const swiperElement = document.querySelector(".mySwiper");
    if (!swiperElement) {
        console.warn("Swiper element (.mySwiper) not found. Swiper not initialized.");
        return;
    }

    if (swiper) {
        swiper.destroy(true, true); // Hancurkan Swiper yang ada sebelum membuat yang baru
    }
    swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        grabCursor: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 10,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            },
        },
    });
    console.log("Swiper initialized."); // Untuk debugging
}

// Realtime Listener
function listenRealtime(table, sectionId, renderer) {
    supabase
        .channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
            console.log(`Realtime change detected in ${table}:`, payload);
            // Memuat ulang section saat ada perubahan
            // Untuk activity, kita perlu memastikan Swiper diinisialisasi ulang
            loadSection(table, sectionId, renderer); // loadSection akan memanggil initializeSwiper() lagi jika sectionId adalah 'activity'
        })
        .subscribe();
}

// Render About Me
function renderAboutMe(data) {
    if (!data || data.length === 0) return;
    const aboutContentDiv = document.querySelector('#about .about-content');
    const aboutImgDiv = document.querySelector('#about .about-img');
    const item = data[0];

    // --- Perbaikan: Menambahkan pemeriksaan null/undefined untuk elemen div ---
    if (aboutContentDiv) {
        if (aboutContentDiv.querySelector('h3')) {
            aboutContentDiv.querySelector('h3').textContent = item.title || '';
        }
        if (aboutContentDiv.querySelector('p:nth-of-type(1)')) {
            aboutContentDiv.querySelector('p:nth-of-type(1)').textContent = item.description || '';
        }
    } else {
        console.warn("About content div not found.");
    }

    if (aboutImgDiv) {
        if (item.image_url && item.image_url.startsWith('http')) {
            aboutImgDiv.innerHTML = `<img src="${item.image_url}" alt="About Me Image" />`;
        } else {
            aboutImgDiv.innerHTML = '';
        }
    } else {
        console.warn("About image div not found.");
    }
}

// Render Project
function renderProject(data) {
    // Pastikan data adalah array dan tidak kosong
    if (!data || data.length === 0) return '';
    return data.map(item => `
        <div class="project-box">
            <img src="${item.image_url}" alt="${item.title}">
            <div class="portfolio-layer">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <a href="${item.link || '#'}" target="_blank"><i class='bx bx-link-external'></i></a>
            </div>
        </div>`).join('');
}

// --- Perbaikan: Render Experience - Disesuaikan agar sesuai dengan struktur CSS experience-box ---
function renderExperience(data) {
    if (!data || data.length === 0) return '';
    return data.map(item => `
        <div class="experience-box">
            <img src="${item.image_url}" alt="${item.title}">
            <div class="experience-content">
                <h3>${item.title}</h3>
                <span class="year">${item.year || ''}</span> <!-- Asumsi ada kolom 'year' di Supabase -->
                <p>${item.description}</p>
            </div>
        </div>`).join('');
}

// --- Perbaikan: Render Activity - Hanya mengembalikan konten dalam .mySwiper, bukan seluruh div .mySwiper ---
function renderActivity(data) {
    if (!data || data.length === 0) return '';
    return `
        <div class="testimonial-content swiper-wrapper">
            ${data.map(act => `
                <div class="testimonial-slide swiper-slide">
                    ${(act.image_url || '').split(',').map(url => `<img src="${url.trim()}" alt="${act.title}">`).join('')}
                    <h3>${act.title}</h3>
                    <p>${act.description}</p>
                    ${act.hashtag ? `<p class="hashtag-text">${act.hashtag}</p>` : ''}
                </div>
            `).join('')}
        </div>
        <!-- Swiper navigation and pagination elements are now siblings to swiper-wrapper -->
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-pagination"></div>
    `;
}
