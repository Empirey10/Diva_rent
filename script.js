// script.js — Mitra Rentcar Ambon

document.addEventListener('DOMContentLoaded', () => {

  /* 1. Mobile menu toggle */
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');

  const closeMenu = () => {
    menu.classList.add('hidden');
    menuIcon.classList.remove('fa-xmark');
    menuIcon.classList.add('fa-bars');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const isHidden = menu.classList.toggle('hidden');
    menuIcon.classList.toggle('fa-xmark', !isHidden);
    menuIcon.classList.toggle('fa-bars', isHidden);
    btn.setAttribute('aria-expanded', String(!isHidden));
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  /* 2. Navbar shadow on scroll */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 3. Scroll-reveal (fade-in + staggered groups) */
  const revealTargets = document.querySelectorAll('.fade-in-section, .stagger');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((el) => observer.observe(el));

  /* 4. Gallery + review-photo lightbox (delegated so dynamic photos work too) */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.gallery-tile img, .review-photos img');
    if (!img) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  const closeLightbox = () => {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* 5. Subtle hero parallax */
  const heroImg = document.querySelector('#home > .absolute.inset-0.z-0 > img');
  if (heroImg) {
    window.addEventListener('scroll', () => {
      const offset = Math.min(window.scrollY * 0.25, 120);
      heroImg.style.transform = `translateY(${offset}px) scale(1.08)`;
    }, { passive: true });
  }

  /* 6. Count-up numbers (trust strip) */
  const counters = document.querySelectorAll('.count-up');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => counterObserver.observe(el));

  /* 7. Ripple effect on primary buttons */
  document.querySelectorAll('.ripple-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  /* 8. Toast helper */
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  let toastTimer;
  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  /* 9. Rating & Reviews (stored locally as a per-visitor history) */
  const STORAGE_KEY = 'mitraRentcarAmbon.reviews';
  const starPicker = document.getElementById('star-picker');
  const ratingInput = document.getElementById('review-rating');
  const reviewForm = document.getElementById('review-form');
  const reviewList = document.getElementById('review-list');
  const reviewEmpty = document.getElementById('review-empty');
  const avgRatingEl = document.getElementById('avg-rating');
  const avgStarsEl = document.getElementById('avg-stars');
  const reviewCountEl = document.getElementById('review-count');

  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveReviews(reviews) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      return true;
    } catch (err) {
      showToast('Penyimpanan penuh — coba kurangi jumlah/ukuran foto.');
      return false;
    }
  }

  function starsMarkup(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fa-solid fa-star" style="color:${i <= rating ? 'var(--purple-600)' : '#e4dcf5'}"></i>`;
    }
    return html;
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* 9a. Photo attachment (compressed client-side, kept small for local storage) */
  const MAX_PHOTOS = 4;
  const photoInput = document.getElementById('review-photo-input');
  const photoBtn = document.getElementById('review-photo-btn');
  const photoPreview = document.getElementById('review-photo-preview');
  let pendingPhotos = [];

  function compressImage(file, maxDim = 640, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoPreview() {
    photoPreview.innerHTML = '';
    pendingPhotos.forEach((src, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb';
      thumb.innerHTML = `<img src="${src}" alt="Pratinjau foto ${idx + 1}"><span class="photo-remove" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></span>`;
      photoPreview.appendChild(thumb);
    });
  }

  if (photoBtn && photoInput) {
    photoBtn.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', async () => {
      const files = Array.from(photoInput.files).slice(0, MAX_PHOTOS - pendingPhotos.length);
      if (!files.length) return;

      for (const file of files) {
        try {
          const compressed = await compressImage(file);
          pendingPhotos.push(compressed);
        } catch (err) {
          showToast('Gagal memproses salah satu foto.');
        }
      }
      renderPhotoPreview();
      photoInput.value = '';
      if (pendingPhotos.length >= MAX_PHOTOS) {
        showToast(`Maksimal ${MAX_PHOTOS} foto per ulasan.`);
      }
    });

    photoPreview.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.photo-remove');
      if (!removeBtn) return;
      pendingPhotos.splice(Number(removeBtn.dataset.idx), 1);
      renderPhotoPreview();
    });
  }

  function renderReviews() {
    const reviews = getReviews();

    // Summary
    const count = reviews.length;
    const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 5;
    avgRatingEl.textContent = avg.toFixed(1);
    avgStarsEl.innerHTML = starsMarkup(Math.round(avg));
    reviewCountEl.textContent = `Berdasarkan ${count} ulasan`;

    // List
    reviewList.innerHTML = '';
    if (!count) {
      reviewEmpty.style.display = 'block';
      return;
    }
    reviewEmpty.style.display = 'none';

    reviews.slice().reverse().forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'review-card';
      card.style.animationDelay = `${Math.min(idx, 6) * 0.06}s`;

      const photosHtml = (r.photos && r.photos.length)
        ? `<div class="review-photos">${r.photos.map((src, i) => `<img src="${src}" alt="Foto ulasan ${r.name} ${i + 1}">`).join('')}</div>`
        : '';
      const videoHtml = r.video
        ? `<a href="${escapeHtml(r.video)}" target="_blank" rel="noopener" class="review-video-badge"><i class="fa-solid fa-circle-play"></i> Tonton Video</a>`
        : '';

      card.innerHTML = `
        <div class="flex items-start gap-4">
          <div class="review-avatar">${initials(r.name)}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p class="font-display font-bold text-ink">${escapeHtml(r.name)}</p>
              <span class="text-xs text-stone-400">${formatDate(r.date)}</span>
            </div>
            <div class="text-sm my-1">${starsMarkup(r.rating)}</div>
            <p class="text-sm leading-relaxed">${escapeHtml(r.text)}</p>
            ${photosHtml}
            ${videoHtml}
          </div>
        </div>`;
      reviewList.appendChild(card);
    });
  }

  if (starPicker) {
    const starBtns = starPicker.querySelectorAll('.star-btn');
    starBtns.forEach((btn) => {
      const value = Number(btn.dataset.value);

      btn.addEventListener('mouseenter', () => {
        starBtns.forEach((b) => b.classList.toggle('is-hover', Number(b.dataset.value) <= value));
      });
      btn.addEventListener('mouseleave', () => {
        starBtns.forEach((b) => b.classList.remove('is-hover'));
      });
      btn.addEventListener('click', () => {
        ratingInput.value = value;
        starBtns.forEach((b) => b.classList.toggle('is-active', Number(b.dataset.value) <= value));
      });
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('review-name').value.trim();
      const text = document.getElementById('review-text').value.trim();
      const video = document.getElementById('review-video').value.trim();
      const rating = Number(ratingInput.value);

      if (!name || !text || !rating) {
        showToast('Lengkapi nama, rating, dan ulasan terlebih dahulu ya.');
        return;
      }

      const reviews = getReviews();
      reviews.push({
        name,
        text,
        rating,
        video: video || null,
        photos: pendingPhotos.slice(),
        date: new Date().toISOString(),
      });
      const saved = saveReviews(reviews);
      if (!saved) return;

      renderReviews();

      reviewForm.reset();
      ratingInput.value = 0;
      pendingPhotos = [];
      renderPhotoPreview();
      starPicker.querySelectorAll('.star-btn').forEach((b) => b.classList.remove('is-active', 'is-hover'));

      showToast('Ulasan terkirim, terima kasih!');
    });
  }

  renderReviews();

});