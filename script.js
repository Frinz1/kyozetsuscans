document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = '/api';
  let currentManga = null;
  let currentChapterIndex = -1;
  let mangaChapters = [];

  // Navigation
  function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.page === sectionId) {
        link.classList.add('active');
      }
    });

    // Remove floating navigation if it exists
    const existingFloatingNav = document.querySelector('.floating-nav');
    if (existingFloatingNav) {
      existingFloatingNav.remove();
    }

    // Remove scroll button if not in chapter reader
    const scrollButton = document.querySelector('.scroll-to-top');
    if (scrollButton) {
      if (sectionId !== 'chapterReader') {
        scrollButton.remove();
      }
    }
  }

  // Setup navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      showSection(page);
      if (page === 'home') {
        fetchLatestReleases();
      } else if (page === 'manga-list') {
        fetchMangaList();
      }
    });
  });

  // Logo click handler
  document.querySelector('.logo').addEventListener('click', () => {
    showSection('home');
    fetchLatestReleases();
  });

  // Genre filter handling
  document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const genre = e.currentTarget.dataset.genre;
      filterMangaByGenre(genre);
    });
  });

  async function fetchLatestReleases() {
    try {
      const response = await fetch(`${API_BASE_URL}/latest-release`);
      const data = await response.json();
      if (data.success) {
        displayMangaList(data.results, 'mangaList');
      } else {
        throw new Error(data.error || 'Failed to fetch latest releases');
      }
    } catch (error) {
      console.error("Error fetching latest releases:", error);
      document.getElementById('mangaList').innerHTML = `
              <div class="error-message">
                  <p>Error loading latest releases. Please try again later.</p>
                  <button onclick="fetchLatestReleases()" class="retry-btn">Retry</button>
              </div>
          `;
    }
  }

  async function fetchMangaList() {
    try {
      const response = await fetch(`${API_BASE_URL}/manga-list`);
      const data = await response.json();
      if (data.success) {
        displayMangaList(data.results, 'filteredMangaList');
      } else {
        throw new Error(data.error || 'Failed to fetch manga list');
      }
    } catch (error) {
      console.error("Error fetching manga list:", error);
      document.getElementById('filteredMangaList').innerHTML = `
              <div class="error-message">
                  <p>Error loading manga list. Please try again later.</p>
                  <button onclick="fetchMangaList()" class="retry-btn">Retry</button>
              </div>
          `;
    }
  }

  async function filterMangaByGenre(genre) {
    try {
      const response = await fetch(`${API_BASE_URL}/manga-list?genre=${encodeURIComponent(genre)}`);
      const data = await response.json();
      if (data.success) {
        displayMangaList(data.results, 'filteredMangaList');
      } else {
        throw new Error(data.error || 'Failed to filter manga');
      }
    } catch (error) {
      console.error("Error filtering manga:", error);
      document.getElementById('filteredMangaList').innerHTML = `
              <div class="error-message">
                  <p>Error filtering manga. Please try again later.</p>
                  <button onclick="fetchMangaList()" class="retry-btn">Retry</button>
              </div>
          `;
    }
  }

  async function searchManga(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        displayMangaList(data.results, 'searchMangaList');
        showSection('searchResults');
      } else {
        throw new Error(data.error || 'Failed to search manga');
      }
    } catch (error) {
      console.error("Error searching manga:", error);
      document.getElementById('searchMangaList').innerHTML = `
              <div class="error-message">
                  <p>Error searching manga. Please try again later.</p>
              </div>
          `;
    }
  }

  function createMangaCard(manga) {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.innerHTML = `
          <img src="${manga.img}" alt="${manga.title}" loading="lazy">
          <div class="manga-info">
              <h3>${manga.title}</h3>
              <p>Status: ${manga.status || "N/A"}</p>
          </div>
      `;
    card.addEventListener("click", () => showMangaDetails(manga));
    return card;
  }

  function displayMangaList(mangaList, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!mangaList || mangaList.length === 0) {
      container.innerHTML = '<div class="error-message">No manga found</div>';
      return;
    }

    mangaList.forEach(manga => {
      container.appendChild(createMangaCard(manga));
    });
  }

  async function showMangaDetails(manga) {
    currentManga = manga;
    const mangaDetails = document.getElementById("mangaDetails");

    document.getElementById("mangaCover").src = manga.img;
    document.getElementById("mangaTitle").textContent = manga.title;
    document.getElementById("mangaStatus").textContent = manga.status || "Unknown";
    document.getElementById("mangaDescription").textContent = manga.description || "No description available.";

    const genresContainer = document.getElementById("mangaGenres");
    genresContainer.innerHTML = '';
    if (manga.genres && manga.genres.length > 0) {
      manga.genres.forEach(genre => {
        const tag = document.createElement("span");
        tag.className = "genre-tag";
        tag.textContent = genre;
        genresContainer.appendChild(tag);
      });
    }

    // Load chapters
    const chapterList = document.getElementById("chapterList");
    chapterList.innerHTML = '<div class="loading">Loading chapters...</div>';

    try {
      const response = await fetch(`${API_BASE_URL}/manga/${manga.id}/chapters`);
      const data = await response.json();

      if (data.success && data.chapters.length > 0) {
        mangaChapters = data.chapters;
        displayChapterList(mangaChapters);
      } else {
        chapterList.innerHTML = `
                  <div class="error-message">
                      <p>No chapters available.</p>
                  </div>
              `;
      }
    } catch (error) {
      console.error("Error loading chapters:", error);
      chapterList.innerHTML = `
              <div class="error-message">
                  <p>Error loading chapters. Please try again later.</p>
                  <button onclick="retryLoadChapters('${manga.id}')" class="retry-btn">Retry</button>
              </div>
          `;
    }

    showSection('mangaDetails');
  }

  function displayChapterList(chapters) {
    const chapterList = document.getElementById("chapterList");
    chapterList.innerHTML = '';

    chapters.forEach((chapter, index) => {
      const chapterItem = document.createElement("div");
      chapterItem.className = "chapter-item";
      chapterItem.innerHTML = `
              <div class="chapter-info">
                  <span class="chapter-number">Chapter ${chapter.chapter}</span>
                  <span class="chapter-title">${chapter.title || ''}</span>
              </div>
          `;
      chapterItem.addEventListener("click", () => {
        currentChapterIndex = index;
        showChapter(chapter.id, currentManga.title, chapter.chapter);
      });
      chapterList.appendChild(chapterItem);
    });

    // Set up first/latest chapter navigation
    document.querySelector(".first-chapter").onclick = () => {
      currentChapterIndex = 0;
      const firstChapter = chapters[0];
      showChapter(firstChapter.id, currentManga.title, firstChapter.chapter);
    };

    document.querySelector(".latest-chapter").onclick = () => {
      currentChapterIndex = chapters.length - 1;
      const latestChapter = chapters[chapters.length - 1];
      showChapter(latestChapter.id, currentManga.title, latestChapter.chapter);
    };
  }

  async function showChapter(chapterId, mangaTitle, chapterNumber) {
    const chapterReader = document.getElementById("chapterReader");
    const chapterTitle = document.getElementById("chapterTitle");
    const pageContainer = document.getElementById("pageContainer");

    chapterTitle.textContent = `${mangaTitle} - Chapter ${chapterNumber}`;
    pageContainer.innerHTML = '<div class="loading">Loading chapter...</div>';

    showSection('chapterReader');

    // Create floating navigation
    const floatingNav = document.createElement('div');
    floatingNav.className = 'floating-nav';
    floatingNav.innerHTML = `
          <button id="floatingPrev" class="nav-btn" ${currentChapterIndex <= 0 ? 'disabled' : ''}>
              <i class="fas fa-chevron-left"></i> Previous
          </button>
          <button id="floatingNext" class="nav-btn" ${currentChapterIndex >= mangaChapters.length - 1 ? 'disabled' : ''}>
              Next <i class="fas fa-chevron-right"></i>
          </button>
      `;
    document.body.appendChild(floatingNav);

    // Create scroll-to-top button
    const scrollButton = document.createElement('button');
    scrollButton.className = 'scroll-to-top';
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollButton);

    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 300) {
        scrollButton.classList.add('show');
      } else {
        scrollButton.classList.remove('show');
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Scroll to top button click handler
    scrollButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    try {
      const response = await fetch(`${API_BASE_URL}/chapter/${chapterId}`);
      const data = await response.json();

      if (data.success && data.pages.length > 0) {
        pageContainer.innerHTML = '';
        data.pages.forEach((pageUrl, index) => {
          const img = document.createElement("img");
          img.src = pageUrl;
          img.alt = `Page ${index + 1}`;
          img.loading = "lazy";
          pageContainer.appendChild(img);
        });

        // Set up navigation button handlers
        const handlePrevChapter = () => {
          if (currentChapterIndex > 0) {
            currentChapterIndex--;
            const prevChapter = mangaChapters[currentChapterIndex];
            showChapter(prevChapter.id, mangaTitle, prevChapter.chapter);
          }
        };

        const handleNextChapter = () => {
          if (currentChapterIndex < mangaChapters.length - 1) {
            currentChapterIndex++;
            const nextChapter = mangaChapters[currentChapterIndex];
            showChapter(nextChapter.id, mangaTitle, nextChapter.chapter);
          }
        };

        document.getElementById("prevChapter").onclick = handlePrevChapter;
        document.getElementById("nextChapter").onclick = handleNextChapter;
        document.getElementById("floatingPrev").onclick = handlePrevChapter;
        document.getElementById("floatingNext").onclick = handleNextChapter;

      } else {
        pageContainer.innerHTML = `
                  <div class="error-message">
                      <p>No pages available for this chapter.</p>
                  </div>
              `;
      }
    } catch (error) {
      console.error("Error loading chapter:", error);
      pageContainer.innerHTML = `
              <div class="error-message">
                  <p>Error loading chapter. Please try again later.</p>
                  <button onclick="retryLoadChapter('${chapterId}', '${mangaTitle}', '${chapterNumber}')" class="retry-btn">
                      Retry
                  </button>
              </div>
          `;
    }

    // Set up back button
    document.getElementById("backToManga").onclick = () => {
      // Remove scroll event listener
      window.removeEventListener('scroll', handleScroll);

      // Remove floating navigation and scroll button
      floatingNav.remove();
      scrollButton.remove();

      showSection('mangaDetails');
    };
  }

  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      searchManga(query);
    }
  });

  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });

  // Add retry functions to window object
  window.retryLoadChapters = async function (mangaId) {
    if (currentManga) {
      await showMangaDetails(currentManga);
    }
  };

  window.retryLoadChapter = async function (chapterId, mangaTitle, chapterNumber) {
    await showChapter(chapterId, mangaTitle, chapterNumber);
  };

  fetchLatestReleases();
});